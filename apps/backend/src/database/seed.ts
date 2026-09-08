import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { UsersService } from '../services/users.service';
import * as bcrypt from 'bcrypt';

async function seedAllUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  // Teeno roles ke default users ki list
  const usersToSeed = [
    {
      email: (process.env.ADMIN_EMAIL || 'admin@drbloomedi.com').toLowerCase(),
      password: process.env.ADMIN_PASSWORD || 'Admin@1234',
      role: 'ADMIN',
      name: 'System Admin',
    },
    {
      email: 'doctor@gmail.com',
      password: '11111111',
      role: 'DOCTOR',
      name: 'Dr. Sharma',
    },
    {
      email: 'rajesh@gmail.com',
      password: '22222222',
      role: 'RECEPTION',
      name: 'Rajesh Receptionist',
    },
  ];

  try {
    for (const item of usersToSeed) {
      const existingUser: any = await usersService.findByEmail(item.email);
      const hashedPassword = await bcrypt.hash(item.password, 10);

      if (existingUser) {
        // Agar user pehle se hai toh password & role refresh karo
        existingUser.password = hashedPassword;
        existingUser.role = item.role;
        if ('isActive' in existingUser) existingUser.isActive = true;

        if (typeof (usersService as any).save === 'function') {
          await (usersService as any).save(existingUser);
        } else if (typeof (usersService as any).userRepository?.save === 'function') {
          await (usersService as any).userRepository.save(existingUser);
        } else if (typeof (usersService as any).usersRepository?.save === 'function') {
          await (usersService as any).usersRepository.save(existingUser);
        } else if (typeof (usersService as any).updatePassword === 'function') {
          await (usersService as any).updatePassword(existingUser.id, hashedPassword);
        }
        console.log(`✅ ${item.role} updated: ${item.email} / ${item.password}`);
      } else {
        // Naya user create karo
        if (typeof (usersService as any).create === 'function') {
          await (usersService as any).create({
            email: item.email,
            password: hashedPassword,
            role: item.role,
            name: item.name,
            isActive: true,
          });
        } else if (item.role === 'ADMIN' && typeof usersService.createAdmin === 'function') {
          await usersService.createAdmin(item.email, item.password);
        }
        console.log(`✅ ${item.role} created: ${item.email} / ${item.password}`);
      }
    }

    console.log('🎉 Sabhi modules ke users ready hain!');
  } catch (error) {
    console.error('Seeding error details:', error);
  } finally {
    await app.close();
  }
}

seedAllUsers().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});