import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import cookieParser = require('cookie-parser');
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'https://drbloomedi.vercel.app',
      ];

      let allowed = allowedOrigins.includes(origin);

      if (!allowed) {
        try {
          const hostname = new URL(origin).hostname;
          allowed =
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            /\.vercel\.app$/.test(hostname);
        } catch {
          allowed = false;
        }
      }

      return callback(null, allowed || true);
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

  
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running smoothly on port: ${port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});