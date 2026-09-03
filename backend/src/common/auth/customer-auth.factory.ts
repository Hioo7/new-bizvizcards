import { APIError, betterAuth } from 'better-auth';
import { jwt } from 'better-auth/plugins';
import { mcp } from '@better-auth/mcp';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../../generated/prisma/client';
import {
  APPLE_SIGN_IN_TRUSTED_ORIGIN,
  CUSTOMER_AUTH_BASE_PATH,
  CUSTOMER_AUTH_COOKIE_PREFIX,
  CUSTOMER_BANNED_MESSAGE,
  MCP_BASE_PATH,
  MCP_LEADS_SCOPES,
  MCP_OFFLINE_ACCESS_SCOPE,
} from './auth.constants';
import { linkAccountWithRetry } from './link-account-with-retry';
import { buildSocialProviders } from './social-providers.builder';
import type { SocialProvidersDeps } from './social-providers.builder';
import {
  hashCustomerPassword,
  verifyCustomerPassword,
} from './customer-password-hasher';

export interface CreateCustomerAuthDeps extends SocialProvidersDeps {
  secret: string;
  baseUrl: string;
  // The public frontend origin — used to build the MCP `resource` (RFC 8707
  // audience) identifier below, and as the `loginPage`/`consentPage` redirect
  // target for the mcp() plugin's browser-facing flows.
  publicAppBaseUrl: string;
  prisma: PrismaClient;
  // The frontend origin(s) — social sign-in's `callbackURL` parameter (set
  // by the frontend to where it wants to land post-OAuth, e.g. the dashboard)
  // must itself be a trusted origin, or better-auth rejects the sign-in
  // request outright with "Invalid callbackURL" before ever reaching the
  // provider. Pass every dev-server origin that should be allowed (e.g. both
  // the main app and the event-management sub-app ports).
  trustedFrontendOrigins: string[];
}

export function createCustomerAuth(deps: CreateCustomerAuthDeps) {
  const mcpResource = `${deps.publicAppBaseUrl}${MCP_BASE_PATH}`;

  return betterAuth({
    secret: deps.secret,
    baseURL: deps.baseUrl,
    basePath: CUSTOMER_AUTH_BASE_PATH,
    database: prismaAdapter(deps.prisma, { provider: 'postgresql' }),
    // Required by the mcp() plugin (built on the OAuth provider): OAuth token
    // issuance goes through /oauth2/token, so better-auth's own generic
    // /token endpoint must be disabled to avoid a conflicting route.
    disabledPaths: ['/token'],
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
      // bcrypt in place of better-auth's default scrypt — the one thing this
      // enables is the legacy-data migration copying legacy CardUser bcrypt
      // hashes directly into CustomerCredential.password with zero forced
      // resets (see the migration plan and customer-password-hasher.ts).
      // customers.service.ts's admin-set-password flow hashes through this
      // exact same function for the same reason — keep both in sync.
      password: {
        hash: hashCustomerPassword,
        verify: verifyCustomerPassword,
      },
    },
    socialProviders: buildSocialProviders(deps),
    trustedOrigins: [
      APPLE_SIGN_IN_TRUSTED_ORIGIN,
      ...deps.trustedFrontendOrigins,
    ],
    plugins: [
      // Signs OAuth access/ID tokens asymmetrically; disableSettingJwtHeader
      // stops it from also setting its own set-auth-jwt response header,
      // which the mcp/oauth2 flow doesn't use (its own /oauth2/userinfo does
      // the equivalent job).
      jwt({ disableSettingJwtHeader: true }),
      mcp({
        loginPage: '/login',
        consentPage: '/oauth/authorize',
        resource: mcpResource,
        // ChatGPT and Claude both support Dynamic Client Registration as
        // their fallback client-registration mechanism (per the MCP
        // authorization spec) — enabled since this app has no pre-existing
        // relationship with either platform's client_id. Registration
        // happens before any user is signed in (the connector registers
        // itself with the AS first), so it must also be reachable
        // unauthenticated — allowDynamicClientRegistration alone only
        // authorizes session- or token-backed registration requests.
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        // offline_access alongside the leads scope: without it, no client
        // (ChatGPT/Claude) ever receives a refresh token — see
        // MCP_OFFLINE_ACCESS_SCOPE's own comment in auth.constants.ts for
        // why, and the "reconnect" failure this otherwise causes once the
        // ~1hr access token expires.
        scopes: [...MCP_LEADS_SCOPES, MCP_OFFLINE_ACCESS_SCOPE],
        // mcp() auto-appends a bare `{ identifier: resource }` entry to
        // `resources` for boot-time seeding UNLESS one with a matching
        // identifier is already present (see appendProtectedResource in
        // @better-auth/mcp). Its own bare-entry seed always inserts
        // allowedScopes: null (its "inherit everything" sentinel), which
        // Prisma's typed String[] column rejects outright
        // (PrismaClientValidationError: "Argument allowedScopes must not be
        // null") — a real incompatibility between the plugin's Kysely-style
        // null-means-unrestricted convention and Prisma's typed adapter.
        // Supplying our own entry for the same identifier, with a concrete
        // (non-null) allowedScopes, sidesteps that broken default entirely.
        resources: [
          {
            identifier: mcpResource,
            allowedScopes: [...MCP_LEADS_SCOPES, MCP_OFFLINE_ACCESS_SCOPE],
          },
        ],
      }),
    ],
  });
}

export type CustomerAuth = ReturnType<typeof createCustomerAuth>;
export type CustomerSession = NonNullable<
  Awaited<ReturnType<CustomerAuth['api']['getSession']>>
>;
