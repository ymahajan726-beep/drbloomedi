import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from 'src/modules/app.module';
import { UsersService } from '../services/users.service';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const configService = app.get(ConfigService);
  const usersService = app.get(UsersService);

  const email = configService.get<string>('ADMIN_EMAIL');
  const password = configService.get<string>('ADMIN_PASSWORD');

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL or ADMIN_PASSWORD is missing');
  }

  const existingUser = await usersService.findByEmail(email);

  if (existingUser) {
    console.log(`Admin user already exists: ${email}`);
    await app.close();
    return;
  }

  await usersService.createAdmin(email, password);

  console.log(`Admin user created: ${email}`);

  await app.close();
}

seedAdmin().catch((error) => {
  console.error('Admin seed failed:', error);
  process.exit(1);
});