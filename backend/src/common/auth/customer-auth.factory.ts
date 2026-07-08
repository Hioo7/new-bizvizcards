import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../../generated/prisma/client';
import {
  CUSTOMER_AUTH_BASE_PATH,
  CUSTOMER_AUTH_COOKIE_PREFIX,
} from './auth.constants';
import { linkAccountWithRetry } from './link-account-with-retry';

export interface CreateCustomerAuthDeps {
  secret: string;
  baseUrl: string;
  prisma: PrismaClient;
}

export function createCustomerAuth(deps: CreateCustomerAuthDeps) {
  return betterAuth({
    secret: deps.secret,
    baseURL: deps.baseUrl,
    basePath: CUSTOMER_AUTH_BASE_PATH,
    database: prismaAdapter(deps.prisma, { provider: 'postgresql' }),
    advanced: {
      cookiePrefix: CUSTOMER_AUTH_COOKIE_PREFIX,
      database: {
        generateId: 'uuid',
      },
    },
    user: {
      modelName: 'CustomerAccount',
    },
    session: {
      modelName: 'CustomerSession',
    },
    account: {
      modelName: 'CustomerCredential',
    },
    verification: {
      modelName: 'CustomerVerification',
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await linkAccountWithRetry('CustomerAuthLink', user.id, () =>
              deps.prisma.customer.upsert({
                where: { accountId: user.id },
                create: { accountId: user.id },
                update: {},
              }),
            );
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
    },
  });
}

export type CustomerAuth = ReturnType<typeof createCustomerAuth>;
export type CustomerSession = NonNullable<
  Awaited<ReturnType<CustomerAuth['api']['getSession']>>
>;
