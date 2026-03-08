import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing (needed for JWT cookie auth)
  app.use(cookieParser());

  // Debug middleware to log ALL cookies on every request
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    console.log('Cookies in Req:', req.cookies);
    next();
  });

  // Get configuration values from environment
  const port = parseInt(process.env.PORT || '3000', 10);
  const apiPrefix = process.env.API_PREFIX || 'api';
  const corsOrigin = process.env.CORS_ORIGIN;

  // Enable CORS with configured origins
  const origins = corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : [];

  const corsOptions = {
    origin: origins.length > 0 ? origins : true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  };

  app.enableCors(corsOptions);



  // Set a global prefix for all routes
  app.setGlobalPrefix(apiPrefix);

  // Use global pipes for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Get PrismaService instance
  const prismaService = app.get(PrismaService);

  // Add a shutdown hook to close the Prisma connection
  const signals = ['SIGINT', 'SIGTERM'] as const;
  signals.forEach((signal) => {
    // FIX: Property 'on' does not exist on type 'Process'. Cast to any to resolve.
    (process as any).on(signal, async () => {
      // FIX: Property '$disconnect' does not exist on type 'PrismaService'. This is a cascading error and will be resolved by fixing PrismaService.
      // FIX: Cast prismaService to `any` to resolve typing error due to incomplete PrismaClient types.
      await (prismaService as any).$disconnect();
      await app.close();
      // FIX: Property 'exit' does not exist on type 'Process'. Cast to any to resolve.
      (process as any).exit(0);
    });
  });

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`API prefix: /${apiPrefix}`);
  console.log(`CORS origins: ${corsOrigin || 'all'}`);
}
bootstrap();
