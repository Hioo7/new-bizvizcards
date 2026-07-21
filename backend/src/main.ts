import 'dotenv/config';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module';
import { AppConfigService } from './common/config/app-config.service';
import { BetterAuthApiErrorFilter } from './common/filters/better-auth-api-error.filter';
import {
  CUSTOMER_AUTH,
  CUSTOMER_AUTH_BASE_PATH,
  EMPLOYEE_AUTH,
  EMPLOYEE_AUTH_BASE_PATH,
} from './common/auth/auth.constants';
import type { EmployeeAuth } from './common/auth/employee-auth.factory';
import type { CustomerAuth } from './common/auth/customer-auth.factory';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const appConfig = app.get(AppConfigService);
  const employeeAuth = app.get<EmployeeAuth>(EMPLOYEE_AUTH);
  const customerAuth = app.get<CustomerAuth>(CUSTOMER_AUTH);

  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.all(
    `${EMPLOYEE_AUTH_BASE_PATH}/*splat`,
    toNodeHandler(employeeAuth),
  );
  httpAdapter.all(
    `${CUSTOMER_AUTH_BASE_PATH}/*splat`,
    toNodeHandler(customerAuth),
  );

  app.enableCors({
    origin: appConfig.corsAllowedOrigins,
    credentials: true,
  });

  app.use(express.json());
  app.useGlobalFilters(new BetterAuthApiErrorFilter());

  await app.listen(appConfig.port);
}
bootstrap();
