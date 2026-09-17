import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Appointment,
  AppointmentStatus,
} from '../entities/appointment.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Department } from '../entities/department.entity';
import { EventsGateway } from '../gateways/events.gateway';

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
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findAll(
    search?: string,
    status?: string,
    doctorId?: string | number,
  ): Promise<Appointment[]> {
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

    // Doctor-wise filtering for doctor dashboard / cabins
    if (doctorId) {
      qb.andWhere('doctor.id = :doctorId', {
        doctorId: Number(doctorId),
      });
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

    if (!apt) {
      throw new NotFoundException('Appointment record not found');
    }

    return apt;
  }

  async create(data: {
    patientId: string;
    doctorId: number;
    departmentId?: string;
    appointmentDate: string;
    timeSlot?: string;
    timeslot?: string;
    slot?: string;
    symptoms?: string;
    reason?: string;
    notes?: string;
  }): Promise<Appointment> {
    const patient = await this.patientRepo.findOne({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Selected patient not found');
    }

    const doctor = await this.doctorRepo.findOne({
      where: { id: Number(data.doctorId) },
      relations: { department: true },
    });

    if (!doctor) {
      throw new NotFoundException('Selected doctor not found');
    }

    let department: Department | null = null;

    if (data.departmentId) {
      department = await this.deptRepo.findOne({
        where: { id: data.departmentId },
      });
    } else if (doctor.department) {
      department = doctor.department;
    }

    const safeTimeSlot =
      (data.timeSlot && data.timeSlot.trim()) ||
      (data.timeslot && data.timeslot.trim()) ||
      (data.slot && data.slot.trim()) ||
      '10:00 AM';

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appointmentNumber = `APT-${new Date().getFullYear()}-${randomSuffix}`;

    const appointment = this.appointmentRepo.create({
      appointmentNumber,
      appointmentDate:
        data.appointmentDate ||
        new Date().toISOString().split('T')[0],
      timeSlot: safeTimeSlot,
      status: AppointmentStatus.SCHEDULED,
      symptoms: data.symptoms || data.reason || 'General Consultation',
      patient,
      doctor,
      department: department || undefined,
    });

    const savedAppointment = await this.appointmentRepo.save(appointment);

    try {
      const fullAppointment = await this.findOne(savedAppointment.id);

      if (this.eventsGateway && this.eventsGateway.server) {
        this.eventsGateway.server.emit('appointment:new', fullAppointment);
      }
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    return savedAppointment;
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
  ): Promise<Appointment> {
    const apt = await this.findOne(id);

    apt.status = status;

    return this.appointmentRepo.save(apt);
  }

  async delete(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await this.appointmentRepo.delete(id);

    if (!res.affected) {
      throw new NotFoundException('Appointment not found');
    }

    return {
      success: true,
      message: 'Appointment cancelled & removed',
    };
  }
}
