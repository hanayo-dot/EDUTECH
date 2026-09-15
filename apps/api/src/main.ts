import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. Cookie Parser
  app.use(cookieParser());

  // 3. CORS Configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-Id',
      'X-Audit-Reason',
      'Idempotency-Key',
    ],
  });

  // 4. API Versioning Prefix
  app.setGlobalPrefix('api/v1');

  // 5. Global Validation Pipes & Envelopes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // 6. OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('ChuoMS Enterprise College Management System API')
    .setDescription(
      'High-concurrency, modular, enterprise REST API for higher-education institutional operations.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Input your JWT access token',
      },
      'bearer',
    )
    .addTag('Authentication & Identity', 'Multi-identifier login, sessions, MFA, and logout')
    .addTag('RBAC & Permissions', 'Institutional roles, granular permissions, and user scopes')
    .addTag('Audit & Compliance', 'Tamper-evident chronological audit trails')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.APP_PORT) || 4000;
  await app.listen(port);
  logger.log(`🚀 ChuoMS API Server running at: http://localhost:${port}/api/v1`);
  logger.log(`📚 OpenAPI / Swagger Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
