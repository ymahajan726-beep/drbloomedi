import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bed, BedStatus } from '../entities/bed.entity';
import { IpdAdmission, AdmissionStatus } from '../entities/ipd-admission.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';

@Injectable()
export class IpdService {
  constructor(
    @InjectRepository(Bed)
    private readonly bedRepo: Repository<Bed>,
    @InjectRepository(IpdAdmission)
    private readonly admissionRepo: Repository<IpdAdmission>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  // 1. Bed Management
  async getAllBeds(wardType?: string, status?: string): Promise<Bed[]> {
    const qb = this.bedRepo.createQueryBuilder('bed').orderBy('bed.bedNumber', 'ASC');
    if (wardType) qb.andWhere('bed.wardType = :wardType', { wardType });
    if (status) qb.andWhere('bed.status = :status', { status });
    return qb.getMany();
  }

  async createBed(data: Partial<Bed>): Promise<Bed> {
    if (!data.bedNumber?.trim()) {
      throw new BadRequestException('Bed number is required');
    }
    const trimmed = data.bedNumber.trim().toUpperCase();
    const existing = await this.bedRepo.findOne({ where: { bedNumber: trimmed } });
    if (existing) {
      throw new ConflictException(`Bed ${trimmed} already exists`);
    }

    const bed = this.bedRepo.create({
      ...data,
      bedNumber: trimmed,
      dailyRate: Math.max(0, Number(data.dailyRate) || 0),
    });
    return this.bedRepo.save(bed);
  }

  // 2. Admission Management
  async getAllAdmissions(status?: string): Promise<IpdAdmission[]> {
    const qb = this.admissionRepo
      .createQueryBuilder('adm')
      .leftJoinAndSelect('adm.patient', 'patient')
      .leftJoinAndSelect('adm.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('adm.bed', 'bed')
      .orderBy('adm.admittedAt', 'DESC');

    if (status) {
      qb.andWhere('adm.status = :status', { status });
    }

    return qb.getMany();
  }

  async admitPatient(data: {
    patientId: string;
    bedId: string;
    doctorId?: number;
    admissionDiagnosis?: string;
  }): Promise<IpdAdmission> {
    const patient = await this.patientRepo.findOne({ where: { id: data.patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const bed = await this.bedRepo.findOne({ where: { id: data.bedId } });
    if (!bed) throw new NotFoundException('Bed not found');

    if (bed.status !== BedStatus.AVAILABLE) {
      throw new BadRequestException(`Bed ${bed.bedNumber} is currently not available`);
    }

    let doctor: Doctor | null = null;
    if (data.doctorId) {
      doctor = await this.doctorRepo.findOne({ where: { id: data.doctorId } });
    }

    // Auto-generate Admission Number
    const timestamp = Date.now().toString().slice(-6);
    const admissionNumber = `IPD-${new Date().getFullYear()}-${timestamp}`;

    const admission = this.admissionRepo.create({
      admissionNumber,
      patient,
      bed,
      doctor: doctor || undefined,
      admissionDiagnosis: data.admissionDiagnosis?.trim(),
      status: AdmissionStatus.ADMITTED,
    });

    // Mark bed as Occupied
    bed.status = BedStatus.OCCUPIED;
    await this.bedRepo.save(bed);

    return this.admissionRepo.save(admission);
  }

  async dischargePatient(
    admissionId: string,
    dischargeSummary?: string,
  ): Promise<IpdAdmission> {
    const admission = await this.admissionRepo.findOne({
      where: { id: admissionId },
      relations: { bed: true },
    });

    if (!admission) {
      throw new NotFoundException('Admission record not found');
    }

    if (admission.status === AdmissionStatus.DISCHARGED) {
      throw new BadRequestException('Patient has already been discharged');
    }

    admission.status = AdmissionStatus.DISCHARGED;
    admission.dischargeSummary = dischargeSummary?.trim() || 'Discharged in stable condition';
    admission.dischargedAt = new Date();

    // Release bed back to Available
    if (admission.bed) {
      admission.bed.status = BedStatus.AVAILABLE;
      await this.bedRepo.save(admission.bed);
    }

    return this.admissionRepo.save(admission);
  }
}