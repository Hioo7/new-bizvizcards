import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, emailOTP } from 'better-auth/plugins';
import { PrismaClient } from '../../generated/prisma/client';
import { EMPLOYEE_ROLE } from '../constants/roles.constants';
import {
  adminRole,
  employeeAccessControl,
  employeeRole,
  superAdminRole,
} from './access-control';
import {
  EMPLOYEE_AUTH_BASE_PATH,
  EMPLOYEE_AUTH_COOKIE_PREFIX,
} from './auth.constants';
import { linkAccountWithRetry } from './link-account-with-retry';
import { OtpSender } from './otp-sender/otp-sender.interface';

export interface CreateEmployeeAuthDeps {
  secret: string;
  baseUrl: string;
  prisma: PrismaClient;
  otpSender: OtpSender;
}

export function createEmployeeAuth(deps: CreateEmployeeAuthDeps) {
  return betterAuth({
    secret: deps.secret,
    baseURL: deps.baseUrl,
    basePath: EMPLOYEE_AUTH_BASE_PATH,
    database: prismaAdapter(deps.prisma, { provider: 'postgresql' }),
    advanced: {
      cookiePrefix: EMPLOYEE_AUTH_COOKIE_PREFIX,
      database: {
        generateId: 'uuid',
      },
    },
    user: {
      modelName: 'EmployeeAccount',
    },
    session: {
      modelName: 'EmployeeSession',
    },
    account: {
      modelName: 'EmployeeCredential',
    },
    verification: {
      modelName: 'EmployeeVerification',
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await linkAccountWithRetry('EmployeeAuthLink', user.id, () =>
              deps.prisma.employee.upsert({
                where: { accountId: user.id },
                create: { accountId: user.id },
                update: {},
              }),
            );
          },
        },
      },
    },
    plugins: [
      admin({
        ac: employeeAccessControl,
        roles: {
          [EMPLOYEE_ROLE.EMPLOYEE]: employeeRole,
          [EMPLOYEE_ROLE.ADMIN]: adminRole,
          [EMPLOYEE_ROLE.SUPER_ADMIN]: superAdminRole,
        },
        defaultRole: EMPLOYEE_ROLE.EMPLOYEE,
        adminRoles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.SUPER_ADMIN],
      }),
      emailOTP({
        disableSignUp: true,
        sendVerificationOTP: ({ email, otp, type }) =>
          deps.otpSender.send({ email, otp, type }),
      }),
    ],
  });
}

export type EmployeeAuth = ReturnType<typeof createEmployeeAuth>;
export type EmployeeSession = NonNullable<
  Awaited<ReturnType<EmployeeAuth['api']['getSession']>>
>;
