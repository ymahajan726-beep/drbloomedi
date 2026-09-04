import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Doctor } from '../entities/doctor.entity';
import { Department } from '../entities/department.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  async getAdminStats() {
    try {
      const [totalDoctors, totalReception, totalDepartments] = await Promise.all([
        this.doctorRepo.count().catch(() => 0),
        this.userRepo.count({ where: { role: UserRole.RECEPTION } }).catch(() => 0),
        this.deptRepo.count().catch(() => 0),
      ]);

      const totalPatients = await this.userRepo.count({
        where: { role: UserRole.PATIENT },
      }).catch(() => 0);

      return {
        totalDoctors: totalDoctors || 0,
        totalPatients: totalPatients || 0,
        totalReception: totalReception || 0,
        totalDepartments: totalDepartments || 0,
      };
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      return {
        totalDoctors: 0,
        totalPatients: 0,
        totalReception: 0,
        totalDepartments: 0,
      };
    }
  }
}