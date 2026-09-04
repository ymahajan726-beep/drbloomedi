import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Department } from '../entities/department.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  async findAll(search?: string, status?: string): Promise<Appointment[]> {
    const qb = this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('appointment.department', 'department')
      .orderBy('appointment.appointmentDate', 'DESC')
      .addOrderBy('appointment.createdAt', 'DESC');

    if (status) {
      qb.andWhere('appointment.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(patient.fullName ILIKE :search OR doctorUser.email ILIKE :search OR appointment.appointmentNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Appointment> {
    const apt = await this.appointmentRepo.findOne({
      where: { id },
      relations: {
        patient: true,
        doctor: { user: true },
        department: true,
      },
    });
    if (!apt) throw new NotFoundException('Appointment record not found');
    return apt;
  }

  async create(data: {
    patientId: string;
    doctorId: number;
    departmentId?: string;
    appointmentDate: string;
    timeSlot: string;
    symptoms?: string;
  }): Promise<Appointment> {
    const patient = await this.patientRepo.findOne({ where: { id: data.patientId } });
    if (!patient) throw new NotFoundException('Selected patient not found');

    const doctor = await this.doctorRepo.findOne({
      where: { id: data.doctorId },
      relations: { department: true },
    });
    if (!doctor) throw new NotFoundException('Selected doctor not found');

    let department: Department | null = null;
    if (data.departmentId) {
      department = await this.deptRepo.findOne({ where: { id: data.departmentId } });
    } else if (doctor.department) {
      department = doctor.department;
    }

    // Generate unique Appointment Token (e.g. APT-2026-8942)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appointmentNumber = `APT-${new Date().getFullYear()}-${randomSuffix}`;

    const appointment = this.appointmentRepo.create({
      appointmentNumber,
      appointmentDate: data.appointmentDate,
      timeSlot: data.timeSlot,
      status: AppointmentStatus.SCHEDULED,
      symptoms: data.symptoms,
      patient,
      doctor,
      department: department || undefined,
    });

    return this.appointmentRepo.save(appointment);
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const apt = await this.findOne(id);
    apt.status = status;
    return this.appointmentRepo.save(apt);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await this.appointmentRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Appointment not found');
    return { success: true, message: 'Appointment cancelled & removed' };
  }
}