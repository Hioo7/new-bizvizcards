import { APIError, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../../generated/prisma/client';
import {
  CUSTOMER_AUTH_BASE_PATH,
  CUSTOMER_AUTH_COOKIE_PREFIX,
  CUSTOMER_BANNED_MESSAGE,
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
      // Surfaces ban state on session.user for type-inference parity with
      // EmployeeAccount (which gets these from better-auth's admin plugin).
      // Not load-bearing for enforcement itself — see the session.create
      // hooks below for that. input: false so a customer can never set these
      // on themselves via any self-service update-profile call.
      additionalFields: {
        banned: {
          type: 'boolean',
          required: false,
          defaultValue: false,
          input: false,
        },
        banReason: { type: 'string', required: false, input: false },
        banExpires: { type: 'date', required: false, input: false },
      },
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
      session: {
        create: {
          // Customer auth has no admin plugin, so there is no built-in ban
          // check like employee auth gets for free — this hand-rolls the
          // same two-part enforcement better-auth's own admin plugin uses
          // for EmployeeAccount: (1) block sign-in here while banned, (2) an
          // active ban also deletes existing sessions (CustomersService.ban)
          // so an already-signed-in customer is logged out immediately too.
          before: async (session) => {
            const account = await deps.prisma.customerAccount.findUnique({
              where: { id: session.userId },
              select: { banned: true, banExpires: true },
            });
            if (!account?.banned) return;

            if (
              account.banExpires &&
              account.banExpires.getTime() < Date.now()
            ) {
              await deps.prisma.customerAccount.update({
                where: { id: session.userId },
                data: { banned: false, banReason: null, banExpires: null },
              });
              return;
            }

            throw new APIError('FORBIDDEN', {
              message: CUSTOMER_BANNED_MESSAGE,
              code: 'BANNED_USER',
            });
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
