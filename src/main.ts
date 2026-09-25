import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { type Express } from 'express';
import 'reflect-metadata';
import { I18nValidationPipe } from 'nestjs-i18n';
import { AppModule } from './app.module';

interface ApplicationInstance {
  app: INestApplication;
  server: Express;
}

const isVercel = Boolean(process.env.VERCEL);

let cachedApplication: ApplicationInstance | null = null;
let bootstrapPromise: Promise<ApplicationInstance> | null = null;

function configureApplication(
  app: INestApplication,
): void {
  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerEnabled = isVercel
    ? process.env.ENABLE_SWAGGER === 'true'
    : process.env.ENABLE_SWAGGER !== 'false';

  if (swaggerEnabled) {
    const swaggerConfig =
      new DocumentBuilder()
        .setTitle('Coffee Shop API')
        .setDescription(
          'Coffee Shop Management System API',
        )
        .setVersion('1.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          'access-token',
        )
        .build();

    const document =
      SwaggerModule.createDocument(
        app,
        swaggerConfig,
      );

    SwaggerModule.setup(
      'api/docs',
      app,
      document,
      {
        swaggerOptions: {
          persistAuthorization: true,
        },
        customSiteTitle: 'Coffee Shop API',
      },
    );
  }
}

async function createServerlessApplication(): Promise<ApplicationInstance> {
  if (cachedApplication) {
    return cachedApplication;
  }

  const server = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: isVercel ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug'],
  });

  configureApplication(app);

  await app.init();

  cachedApplication = {
    app,
    server,
  };

  console.log('NestJS serverless application initialized');

  return cachedApplication;
}

async function getServerlessApplication(): Promise<ApplicationInstance> {
  if (cachedApplication) {
    return cachedApplication;
  }

  bootstrapPromise ??= createServerlessApplication();

  try {
    return await bootstrapPromise;
  } catch (error) {
    bootstrapPromise = null;
    throw error;
  }
}

/**
 * Vercel Serverless handler.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  try {
    const { server } = await getServerlessApplication();

    server(request, response);
  } catch (error: unknown) {
    console.error('NestJS Vercel bootstrap failed:', error);

    if (!response.headersSent) {
      response.status(500).json({
        statusCode: 500,
        message: 'Application bootstrap failed',
      });
    }
  }
}

/**
 * Local, VPS hoặc Docker.
 */
async function bootstrapStandalone(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  configureApplication(app);

  const port = Number(process.env.PORT) || 8088;

  await app.listen(port, '0.0.0.0');
  console.log(`Application running at http://localhost:${port}`);
  console.log(`API prefix: http://localhost:${port}/api`);

  if (process.env.ENABLE_SWAGGER !== 'false') {
    console.log(`Swagger: http://localhost:${port}/api/docs`);
  }
}


// Vercel chỉ gọi default export, không mở port.
if (!isVercel) {
  void bootstrapStandalone().catch((error: unknown) => {
    console.error('NestJS standalone bootstrap failed:', error);
    process.exitCode = 1;
  });
}
