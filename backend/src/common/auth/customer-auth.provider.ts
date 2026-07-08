import { Provider } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { CUSTOMER_AUTH } from './auth.constants';
import { createCustomerAuth } from './customer-auth.factory';

export const customerAuthProvider: Provider = {
  provide: CUSTOMER_AUTH,
  useFactory: (appConfig: AppConfigService, prisma: PrismaService) =>
    createCustomerAuth({
      secret: appConfig.betterAuthCustomerSecret,
      baseUrl: appConfig.betterAuthUrl,
      prisma,
    }),
  inject: [AppConfigService, PrismaService],
};
