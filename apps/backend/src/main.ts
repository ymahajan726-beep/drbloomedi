import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import {join} from 'path';
import * as express from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Dynamic CORS configuration (Handles localhost, IP, and local network requests smoothly)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
      ];

      // Allow any localhost port or configured frontend origin
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      return callback(null, true); // Dev environment me safe access allow karta hai
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
      'apollo-require-preflight',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Explicitly bind to '0.0.0.0' taaki localhost aur IPv4/IPv6 dono traffic smoothly receive ho
  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();