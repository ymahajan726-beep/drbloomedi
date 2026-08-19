import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UsersService } from '../users/users.service';
import { DepartmentsService } from '../departments/departments.service';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorsRepository: Repository<Doctor>,
    private readonly usersService: UsersService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  async create(createDto: CreateDoctorDto) {
    const user = await this.usersService.findOne(createDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let department = undefined;
    if (createDto.departmentId) {
      department = await this.departmentsService.findOne(createDto.departmentId);
      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    const doctor = this.doctorsRepository.create({
      user,
      specialization: createDto.specialization,
      qualifications: createDto.qualifications,
      department,
      phone: createDto.phone,
      isActive: typeof createDto.isActive === 'boolean' ? createDto.isActive : true,
    });

    return this.doctorsRepository.save(doctor);
  }

  findAll() {
    // TypeORM relation typing differs between versions; cast to any to keep typings compatible
    return this.doctorsRepository.find({ relations: ['user', 'department'] as any });
  }

  async findOne(id: number) {
    const doctor = await this.doctorsRepository.findOne({ where: { id }, relations: ['user', 'department'] as any });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }

  async update(id: number, updateDto: UpdateDoctorDto) {
    const doctor = await this.findOne(id);

    if (updateDto.userId) {
      const user = await this.usersService.findOne(updateDto.userId);
      if (!user) throw new NotFoundException('User not found');
      doctor.user = user;
    }

    if (updateDto.departmentId) {
      const department = await this.departmentsService.findOne(updateDto.departmentId);
      if (!department) throw new NotFoundException('Department not found');
      doctor.department = department;
    }

    if (typeof updateDto.specialization !== 'undefined') doctor.specialization = updateDto.specialization;
    if (typeof updateDto.qualifications !== 'undefined') doctor.qualifications = updateDto.qualifications;
    if (typeof updateDto.phone !== 'undefined') doctor.phone = updateDto.phone;
    if (typeof updateDto.isActive !== 'undefined') doctor.isActive = updateDto.isActive;

    return this.doctorsRepository.save(doctor);
  }

  async remove(id: number) {
    const doctor = await this.findOne(id);
    // Soft-delete by setting isActive=false could be used, but per requirement provide delete
    await this.doctorsRepository.delete(id);
    return { message: 'Doctor deleted' };
  }
}
