import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billing, PaymentStatus } from '../entities/billing.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';
import { Department } from '../entities/department.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Billing)
    private readonly billingRepo: Repository<Billing>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  async getExecutiveReport() {
    const bills = await this.billingRepo.find();

    let totalRevenue = 0;
    let pendingDues = 0;
    let totalDiscount = 0;
    const paymentModes: Record<string, number> = {};

    for (const bill of bills) {
      const amount = Number(bill.totalAmount) || 0;
      totalDiscount += Number(bill.discount) || 0;

      if (bill.paymentStatus === PaymentStatus.PAID) {
        totalRevenue += amount;
      } else if (bill.paymentStatus === PaymentStatus.PENDING) {
        pendingDues += amount;
      }

      paymentModes[bill.paymentMethod] =
        (paymentModes[bill.paymentMethod] || 0) + amount;
    }

    const appointments = await this.appointmentRepo.find();

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (a) => a.status === AppointmentStatus.COMPLETED,
    ).length;
    const scheduledAppointments = appointments.filter(
      (a) => a.status === AppointmentStatus.SCHEDULED,
    ).length;
    const cancelledAppointments = appointments.filter(
      (a) => a.status === AppointmentStatus.CANCELLED,
    ).length;

    const [totalPatients, totalDoctors, totalDepartments] =
      await Promise.all([
        this.patientRepo.count(),
        this.doctorRepo.count(),
        this.deptRepo.count(),
      ]);

    const recentInvoices = await this.billingRepo.find({
      relations: { patient: true },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      financials: {
        totalRevenue,
        pendingDues,
        totalDiscount,
        totalInvoices: bills.length,
        paymentModes,
      },
      appointments: {
        totalAppointments,
        completedAppointments,
        scheduledAppointments,
        cancelledAppointments,
      },
      resources: {
        totalPatients,
        totalDoctors,
        totalDepartments,
      },
      recentInvoices,
    };
  }
}
