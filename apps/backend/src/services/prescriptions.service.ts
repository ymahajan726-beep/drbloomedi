import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from '../entities/prescription.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity'; // 👈 यहाँ AppointmentStatus इम्पोर्ट करें

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private prescriptionRepo: Repository<Prescription>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  async create(data: any) {
  try {
    // 1. अगर फ़्रंटएंड से डॉक्टर आईडी नहीं आई तो अपॉइंटमेंट से निकालें
    if (!data.doctorId && data.appointmentId) {
      const apt = await this.appointmentRepo.findOne({
        where: { id: data.appointmentId },
      });
      if (apt && (apt as any).doctorId) {
        data.doctorId = (apt as any).doctorId;
      }
    }

    const rx = this.prescriptionRepo.create({
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      symptoms: data.symptoms || '',
      diagnosis: data.diagnosis,
      vitals: data.vitals || null,
      medicines: data.medicines || [],
      labTests: data.labTests || '',
      advice: data.advice || '',
      followUpDate: data.followUpDate || '',
    });

    const savedRx = await this.prescriptionRepo.save(rx);

    // 2. अपॉइंटमेंट को 'Completed' मार्क करें
    await this.appointmentRepo.update(data.appointmentId, {
      status: AppointmentStatus.COMPLETED,
    });

    return savedRx;
  } catch (error) {
    console.error('🔥 Error saving prescription:', error);
    throw error;
  }
}

  async findByAppointment(appointmentId: string) {
    const rx = await this.prescriptionRepo.findOne({
      where: { appointmentId },
      relations: {
        patient: true,
        doctor: {
          user: true,
        },
      },
    });
    if (!rx) throw new NotFoundException('Prescription not found');
    return rx;
  }

  async findByPatient(patientId: string) {
    return this.prescriptionRepo.find({
      where: { patientId },
      relations: {
        doctor: {
          user: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }
}