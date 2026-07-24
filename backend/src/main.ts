import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import dotenv from 'dotenv';
import { AppModule } from './app.module';
import { initDatabase } from '@/infrastructure/database/database';
import { logger } from '@/infrastructure/logging/logger';
import { TypeORMMetricsRepository } from '@/adapters/repositories/TypeORMMetricsRepository';
import { validateEnvConfig } from '@/infrastructure/config/env.config';
import { AllExceptionsFilter } from '@/infrastructure/filters/all-exceptions.filter';

dotenv.config();
validateEnvConfig();

const PORT = process.env.PORT || 3000;

export async function bootstrap(): Promise<NestFastifyApplication> {
  await initDatabase();
  const metricsRepo = new TypeORMMetricsRepository();
  await metricsRepo.loadGlobalMetricsCache();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );

  // Register security headers via Fastify Helmet
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false // Keep CSP false to allow SVG card rendering inside img tags
  });

  // Register CORS
  await app.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
  });

  // Serve public static assets
  const publicDir = path.resolve(__dirname, '../../public');
  await app.register(fastifyStatic, {
    root: publicDir,
    prefix: '/',
    extensions: ['html'],
    decorateReply: true,
    setHeaders: (res: any, filePath: string) => {
      const setHeader = (key: string, val: string) => {
        if (typeof res.setHeader === 'function') {
          res.setHeader(key, val);
        } else if (typeof res.header === 'function') {
          res.header(key, val);
        } else if (res.raw && typeof res.raw.setHeader === 'function') {
          res.raw.setHeader(key, val);
        }
      };

      if (filePath.includes('/_astro/')) {
        setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html')) {
        setHeader('Cache-Control', 'no-cache, must-revalidate');
      }
    }
  });

  // Global exception filter: centralize error logging, prevent stack trace leaks
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global pipe for runtime DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  await app.listen(PORT, '0.0.0.0');
  logger.info(`🚀 NestJS Fastify server running on http://localhost:${PORT}`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });

  return app;
}

// Automatically boot if executed directly
if (require.main === module) {
  bootstrap().catch((err) => {
    logger.error('Failed to start NestJS Fastify server:', { error: err });
    process.exit(1);
  });
}
