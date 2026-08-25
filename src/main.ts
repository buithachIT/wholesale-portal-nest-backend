import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptors';
import { REFRESH_TOKEN_COOKIE } from './auth/utils/refresh-token-cookie';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
      : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT ?? 3000;

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('B2B Wholesale Portal - By TCP dev team')
    .setDescription('B2B Logistics / Wholesale Portal API - By TCP dev team')
    .setVersion('0.0.1')
    .addServer(process.env.APP_URL ?? `http://localhost:${port}`)
    .addTag('companies', 'Quản lý doanh nghiệp')
    .addTag('auth', 'Đăng nhập')
    .addBearerAuth()
    .addCookieAuth(REFRESH_TOKEN_COOKIE)
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'openapi.json',
    yamlDocumentUrl: 'openapi.yaml',
  });

  app.use(
    '/docs',
    apiReference({
      content: document,
      pageTitle: 'B2B Wholesale Portal API',
    }),
  );

  await app.listen(port, '0.0.0.0');
}
void bootstrap();
