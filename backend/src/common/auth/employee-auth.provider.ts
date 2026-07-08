import { Provider } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { EMPLOYEE_AUTH } from './auth.constants';
import { createEmployeeAuth } from './employee-auth.factory';
import { NodemailerOtpSender } from './otp-sender/nodemailer-otp-sender.service';

export const employeeAuthProvider: Provider = {
  provide: EMPLOYEE_AUTH,
  useFactory: (
    appConfig: AppConfigService,
    prisma: PrismaService,
    otpSender: NodemailerOtpSender,
  ) =>
    createEmployeeAuth({
      secret: appConfig.betterAuthStaffSecret,
      baseUrl: appConfig.betterAuthUrl,
      prisma,
      otpSender,
    }),
  inject: [AppConfigService, PrismaService, NodemailerOtpSender],
};
