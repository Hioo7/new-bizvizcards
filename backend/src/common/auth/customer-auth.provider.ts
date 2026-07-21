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
      trustedFrontendOrigins: appConfig.corsAllowedOrigins,
      prisma,
      googleClientId: appConfig.googleOAuthClientId,
      googleClientSecret: appConfig.googleOAuthClientSecret,
      appleClientId: appConfig.appleOAuthClientId,
      appleTeamId: appConfig.appleOAuthTeamId,
      appleKeyId: appConfig.appleOAuthKeyId,
      applePrivateKey: appConfig.appleOAuthPrivateKey,
      appleAppBundleIdentifier: appConfig.appleOAuthAppBundleIdentifier,
    }),
  inject: [AppConfigService, PrismaService],
};
