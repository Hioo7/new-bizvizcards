# ChatGPT/Claude MCP + OAuth Leads Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a customer connect ChatGPT or Claude to this app as an MCP "app"/connector, authorizing via OAuth 2.1 on top of their existing login, so the AI agent can list/get/create/update their leads and add/list notes and reminders on them.

**Architecture:** Add better-auth's `jwt()` + `@better-auth/mcp`'s `mcp()` plugins to the existing `customer-auth` better-auth instance (reuses the customer's existing session — no new identity system). A new NestJS-hosted MCP module mounts a Streamable-HTTP MCP server at `POST /api/mcp`, guarded by better-auth's own MCP auth middleware, exposing tools that are thin adapters over the **existing** `LeadsService`/`LeadReferenceNotesService`/`RemindersService`. The frontend gets a new `/oauth/authorize` consent screen and a "Connected Apps" management page — both driven entirely by endpoints the `mcp`/`oauthProvider` plugin already exposes under `/api/auth/customers/oauth2/*` (no bespoke consent-storage backend code needed).

**Tech Stack:** NestJS 11 + Prisma 7 + Zod (backend), React 19 + Vite + react-router-dom v7 + daisyUI v5 (frontend), better-auth 1.6.23 + `@better-auth/mcp` + `@modelcontextprotocol/sdk` (MCP/OAuth layer).

**Spec:** `C:\Users\prana\.claude\plans\see-the-goal-of-robust-moth.md` (brainstormed/approved architecture — this plan implements it, with two implementation-level refinements found during research, both noted inline where they occur: (1) "Connected Apps" needs no custom backend module — it calls better-auth's own `/oauth2/get-consents` and `/oauth2/delete-consent` endpoints directly; (2) rate limiting on the new endpoints must be plain Express middleware (`express-rate-limit`), not `@nestjs/throttler`, because these routes are mounted directly on the raw Express adapter — outside Nest's own routing/guard pipeline — exactly like the existing better-auth mounts in `main.ts`).

## Global Constraints

- Backend: NestJS v11, Prisma v7 multi-file schema, Zod DTOs with inferred types, `npm install` only (never hand-edit `package.json`/`package-lock.json`), no `any`/`unknown`, lint+build+all tests must pass (backend/CLAUDE.md).
- Frontend: React 19 + Tailwind v4/daisyUI v5, theme colors only, no hardcoded values (constants go in `config/`), one component per file, feature barrel exports, `npm run lint` and `npm run build` clean with zero warnings (frontend/CLAUDE.md).
- Every new env var is added to both `backend/.env` and `backend/.env.template`, and read only through `AppConfigService` (Zod-validated), never `process.env` directly outside that one file.
- Every test (unit or integration) that touches the DB runs against `TEST_DATABASE_URL`, seeds its own data, and cleans up in `afterEach`/`finally`.
- Reuse existing services (`LeadsService`, `LeadReferenceNotesService`, `RemindersService`, `CustomersService`) for all data operations — the MCP layer adds no new business logic or ownership-scoping logic of its own.

---

## Task 1: Customer-auth factory — add `jwt()` + `mcp()` plugins

**Files:**
- Modify: `backend/src/common/auth/customer-auth.factory.ts`
- Modify: `backend/src/common/auth/customer-auth.provider.ts`
- Modify: `backend/src/common/auth/auth.constants.ts`
- Modify: `backend/src/common/config/env.schema.ts`
- Modify: `backend/src/common/config/app-config.service.ts`
- Modify: `backend/.env`, `backend/.env.template`
- Modify: `backend/prisma/auth-cli/customer-auth.cli-config.ts`
- Test: `backend/src/common/auth/customer-auth.factory.spec.ts`

**Interfaces:**
- Produces: `MCP_BASE_PATH` constant (`'/api/mcp'`) from `auth.constants.ts`, used by Task 3 and Task 8.
- Produces: `AppConfigService.publicAppBaseUrl` (already exists) is now also threaded into `createCustomerAuth` as the MCP `resource` identifier.

- [ ] **Step 1: Add `MCP_BASE_PATH` constant**

In `backend/src/common/auth/auth.constants.ts`, add near the other base-path constants:

```ts
// Canonical MCP server endpoint — also used as the OAuth `resource` (RFC 8707
// audience) identifier for the customer-auth mcp() plugin. See
// customer-auth.factory.ts and modules/mcp/mcp-http-handler.ts.
export const MCP_BASE_PATH = '/api/mcp';
```

- [ ] **Step 2: Write the failing test for the new plugin config**

In `backend/src/common/auth/customer-auth.factory.spec.ts`, add (this file likely already tests other aspects of `createCustomerAuth` — add this as a new `describe` block, following whatever `deps` fixture the existing tests already build; if none exists, build a minimal one as shown):

```ts
import { PrismaClient } from '../../generated/prisma/client';
import { MCP_BASE_PATH } from './auth.constants';
import { createCustomerAuth } from './customer-auth.factory';

describe('createCustomerAuth — MCP/OAuth plugin wiring', () => {
  function buildAuth() {
    return createCustomerAuth({
      secret: 'a'.repeat(32),
      baseUrl: 'http://localhost:3000',
      publicAppBaseUrl: 'http://localhost:5173',
      trustedFrontendOrigins: [],
      prisma: {} as PrismaClient,
    });
  }

  it('exposes the oauth2 authorize endpoint (mcp plugin mounted)', () => {
    const auth = buildAuth();
    const paths = Object.keys(auth.api);
    expect(paths.some((p) => p.toLowerCase().includes('oauth'))).toBe(true);
  });

  it('exposes a jwks endpoint (jwt plugin mounted)', () => {
    const auth = buildAuth();
    const paths = Object.keys(auth.api);
    expect(paths.some((p) => p.toLowerCase().includes('jwks'))).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx jest customer-auth.factory.spec.ts -t "MCP/OAuth plugin wiring"`
Expected: FAIL — `publicAppBaseUrl` doesn't exist on `CreateCustomerAuthDeps` yet (TS compile error) and no oauth2/jwks endpoints are exposed yet.

- [ ] **Step 4: Add `publicAppBaseUrl` to `AppConfigService` env plumbing**

`PUBLIC_APP_BASE_URL` already exists in `env.schema.ts`/`app-config.service.ts` (used for canonical URLs) — no change needed there. Confirm by checking `app-config.service.ts:40-42` (`get publicAppBaseUrl(): string`). Skip to Step 5.

- [ ] **Step 5: Extend `customer-auth.factory.ts` with the new plugins**

```ts
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
} from './auth.constants';
// ...existing imports unchanged...

export interface CreateCustomerAuthDeps extends SocialProvidersDeps {
  secret: string;
  baseUrl: string;
  // The public frontend origin — used to build the MCP `resource` (RFC 8707
  // audience) identifier below, and as the `loginPage`/`consentPage` redirect
  // target for the mcp() plugin's browser-facing flows.
  publicAppBaseUrl: string;
  prisma: PrismaClient;
  trustedFrontendOrigins: string[];
}

export function createCustomerAuth(deps: CreateCustomerAuthDeps) {
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
      database: { generateId: 'uuid' },
    },
    // ...existing user/session/account/verification/databaseHooks/emailAndPassword blocks unchanged...
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
        resource: `${deps.publicAppBaseUrl}${MCP_BASE_PATH}`,
        // ChatGPT and Claude both support Dynamic Client Registration as
        // their fallback client-registration mechanism (per the MCP
        // authorization spec) — enabled since this app has no pre-existing
        // relationship with either platform's client_id.
        allowDynamicClientRegistration: true,
      }),
    ],
  });
}

export type CustomerAuth = ReturnType<typeof createCustomerAuth>;
export type CustomerSession = NonNullable<
  Awaited<ReturnType<CustomerAuth['api']['getSession']>>
>;
```

- [ ] **Step 6: Update `customer-auth.provider.ts` to pass `publicAppBaseUrl`**

```ts
export const customerAuthProvider: Provider = {
  provide: CUSTOMER_AUTH,
  useFactory: (appConfig: AppConfigService, prisma: PrismaService) =>
    createCustomerAuth({
      secret: appConfig.betterAuthCustomerSecret,
      baseUrl: appConfig.betterAuthUrl,
      publicAppBaseUrl: appConfig.publicAppBaseUrl,
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
```

- [ ] **Step 7: Update the CLI shadow config so schema generation sees the new plugins**

`backend/prisma/auth-cli/customer-auth.cli-config.ts` currently calls `createCustomerAuth` without `publicAppBaseUrl` — add it:

```ts
export const auth = createCustomerAuth({
  secret: process.env.BETTER_AUTH_CUSTOMER_SECRET!,
  baseUrl: process.env.BETTER_AUTH_URL!,
  publicAppBaseUrl: process.env.PUBLIC_APP_BASE_URL!,
  trustedFrontendOrigins: [],
  prisma,
});
```

- [ ] **Step 8: `npm install @better-auth/mcp` in `backend/`**

Run: `cd backend && npm install @better-auth/mcp`
(`jwt` ships inside the already-installed `better-auth` package at `better-auth/plugins` — no separate install needed for it.)

- [ ] **Step 9: Run test to verify it passes**

Run: `cd backend && npx jest customer-auth.factory.spec.ts -t "MCP/OAuth plugin wiring"`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add backend/src/common/auth backend/prisma/auth-cli/customer-auth.cli-config.ts backend/package.json backend/package-lock.json
git commit -m "feat(auth): add jwt + mcp plugins to customer-auth for OAuth/MCP support"
```

---

## Task 2: Regenerate Prisma schema and migrate

**Files:**
- Modify: `backend/prisma/schema/customer-auth.prisma` (regenerated — will gain OAuth application/token/consent + JWKS models)
- Create: a new Prisma migration under `backend/prisma/migrations/`

**Interfaces:**
- Produces: whatever model names better-auth's CLI generates (confirm exact names after running — expect something like `OauthApplication`, `OauthAccessToken`, `OauthConsent`, `Jwks`, based on the `@better-auth/mcp`/`jwt` plugins' documented schema). Task 9's integration test and any later reads (none needed — the frontend talks to better-auth's own `/oauth2/*` HTTP endpoints, not these tables directly) don't need to know the names, since nothing in our own code queries them directly.

- [ ] **Step 1: Regenerate the schema file**

Run: `cd backend && npx auth generate --config prisma/auth-cli/customer-auth.cli-config.ts --output prisma/schema/customer-auth.prisma`

- [ ] **Step 2: Review the diff**

Run: `git -C backend diff prisma/schema/customer-auth.prisma`
Confirm: existing `CustomerAccount`/`CustomerSession`/`CustomerCredential`/`CustomerVerification` models are unchanged (same fields, same `@@map`), and new models for OAuth applications/tokens/consents and JWKS have been appended. These new OAuth-plugin models intentionally live in this same file — the auth CLI generates one file per better-auth instance (customer-auth's existing 4 models already share this file today), so this isn't new coupling, just the same established pattern extended to the new plugins on the same instance.

- [ ] **Step 3: Generate and review the migration**

Run: `cd backend && npx prisma migrate dev --name add_customer_mcp_oauth_tables`
Confirm the generated `migration.sql` only *creates* new tables (no `ALTER`/`DROP` touching existing customer-auth tables). If it does anything else, stop and inspect before proceeding — this migration should be additive-only.

- [ ] **Step 4: Regenerate the Prisma client**

Run: `cd backend && npx prisma generate`

- [ ] **Step 5: Verify the app still boots**

Run: `cd backend && npm run build`
Expected: builds clean (confirms the regenerated schema/client didn't break any existing typed Prisma usage).

- [ ] **Step 6: Commit**

```bash
git add backend/prisma
git commit -m "feat(db): add mcp/jwt oauth tables to customer-auth schema"
```

---

## Task 3: MCP module scaffolding — auth middleware, server factory, HTTP mount

**Files:**
- Create: `backend/src/modules/mcp/mcp.module.ts`
- Create: `backend/src/modules/mcp/mcp.constants.ts`
- Create: `backend/src/modules/mcp/mcp-auth.middleware.ts`
- Create: `backend/src/modules/mcp/services/mcp-server.service.ts`
- Create: `backend/src/modules/mcp/mcp-http-handler.ts`
- Test: `backend/src/modules/mcp/services/mcp-server.service.spec.ts`
- Modify: `backend/src/main.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Consumes: `CUSTOMER_AUTH_BASE_PATH`, `MCP_BASE_PATH` (Task 1), `AppConfigService.betterAuthUrl` (existing), `CustomersService.getByAccountId` (existing, `backend/src/modules/customers/services/customers.service.ts:75`).
- Produces: `McpServerService.createServer(customerId: string): McpServer` — consumed by Tasks 4–7 (each task registers its tool group onto the server passed in) and by `mcp-http-handler.ts`.
- Produces: `McpAuthenticatedRequest` type (`request.mcpSession: { userId: string; scopes: string[] }`) — consumed by `mcp-http-handler.ts`.

- [ ] **Step 1: `npm install` the MCP SDK**

Run: `cd backend && npm install @modelcontextprotocol/sdk`

- [ ] **Step 2: `mcp.constants.ts`**

```ts
export const MCP_SERVER_NAME = 'bizvizcards-leads';
export const MCP_SERVER_VERSION = '1.0.0';
```

- [ ] **Step 3: `mcp-auth.middleware.ts`**

```ts
import { createMcpAuthClient } from 'better-auth/plugins/mcp/client';
import type { Request } from 'express';
import { CUSTOMER_AUTH_BASE_PATH } from '../../common/auth/auth.constants';

export interface McpAuthenticatedRequest extends Request {
  mcpSession: { userId: string; scopes: string[] };
}

export function createMcpAuthMiddleware(betterAuthUrl: string) {
  return createMcpAuthClient({
    authURL: `${betterAuthUrl}${CUSTOMER_AUTH_BASE_PATH}`,
  }).middleware();
}
```

- [ ] **Step 4: Write the failing unit test for `McpServerService`**

```ts
// backend/src/modules/mcp/services/mcp-server.service.spec.ts
import { McpServerService } from './mcp-server.service';

describe('McpServerService', () => {
  it('creates a server exposing at least one registered tool', async () => {
    const service = new McpServerService();
    const server = service.createServer('customer-1');

    // McpServer doesn't expose a public "list tools" getter directly, so
    // assert indirectly via its internal registered-tools map (populated by
    // registerTool calls in Tasks 4-7; until those land this test only
    // proves the factory returns a connectable McpServer instance).
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe('function');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd backend && npx jest mcp-server.service.spec.ts`
Expected: FAIL — `mcp-server.service.ts` doesn't exist yet.

- [ ] **Step 6: `mcp-server.service.ts` — minimal factory (tool registration added in Tasks 4-7)**

```ts
import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from '../mcp.constants';

@Injectable()
export class McpServerService {
  createServer(customerId: string): McpServer {
    const server = new McpServer({
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    });

    // Task 4 calls registerLeadsTools(server, ..., customerId) here.
    // Task 5 calls registerLeadNoteTools(server, ..., customerId) here.
    // Task 6 calls registerLeadReminderTools(server, ..., customerId) here.

    return server;
  }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && npx jest mcp-server.service.spec.ts`
Expected: PASS

- [ ] **Step 8: `mcp-http-handler.ts` — request-scoped transport wiring**

```ts
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Response } from 'express';
import { CustomersService } from '../customers/services/customers.service';
import type { McpAuthenticatedRequest } from './mcp-auth.middleware';
import { McpServerService } from './services/mcp-server.service';

export function createMcpHttpHandler(deps: {
  mcpServerService: McpServerService;
  customersService: CustomersService;
}) {
  return async (req: McpAuthenticatedRequest, res: Response): Promise<void> => {
    const customer = await deps.customersService.getByAccountId(
      req.mcpSession.userId,
    );
    const server = deps.mcpServerService.createServer(customer.id);
    // Stateless mode (sessionIdGenerator: undefined) — each request gets a
    // fresh server+transport pair scoped to the resolved customer, so tool
    // closures never leak across customers. Matches the SDK's documented
    // stateless pattern for simple API-style servers.
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  };
}
```

- [ ] **Step 9: `mcp.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { McpServerService } from './services/mcp-server.service';

@Module({
  imports: [CustomersModule],
  providers: [McpServerService],
  exports: [McpServerService],
})
export class McpModule {}
```

- [ ] **Step 10: Register `McpModule` in `app.module.ts`**

Add `McpModule` to the `imports` array (alongside `CustomersModule`, etc.) and the corresponding import statement.

- [ ] **Step 11: Mount the MCP endpoint in `main.ts`**

Body-parsing order matters here: unlike the better-auth mounts (which parse their own bodies and must sit before `bodyParser: false`'s effect is worked around), `StreamableHTTPServerTransport.handleRequest(req, res, req.body)` expects `req.body` to already be JSON-parsed — so this mount goes **after** `app.use(express.json())`.

```ts
import { createMcpAuthMiddleware } from './modules/mcp/mcp-auth.middleware';
import { createMcpHttpHandler } from './modules/mcp/mcp-http-handler';
import { McpServerService } from './modules/mcp/services/mcp-server.service';
import { CustomersService } from './modules/customers/services/customers.service';
import { MCP_BASE_PATH } from './common/auth/auth.constants';

async function bootstrap() {
  // ...existing app creation, employeeAuth/customerAuth mounts...

  app.enableCors({
    origin: appConfig.corsAllowedOrigins,
    credentials: true,
  });

  app.use(express.json());

  httpAdapter.use(MCP_BASE_PATH, createMcpAuthMiddleware(appConfig.betterAuthUrl));
  httpAdapter.post(
    MCP_BASE_PATH,
    createMcpHttpHandler({
      mcpServerService: app.get(McpServerService),
      customersService: app.get(CustomersService),
    }),
  );

  app.useGlobalFilters(new BetterAuthApiErrorFilter());

  await app.listen(appConfig.port);
}
```

- [ ] **Step 12: Commit**

```bash
git add backend/src/modules/mcp backend/src/main.ts backend/src/app.module.ts backend/package.json backend/package-lock.json
git commit -m "feat(mcp): scaffold MCP module with auth-guarded Streamable HTTP endpoint"
```

---

## Task 4: Leads MCP tools

**Files:**
- Create: `backend/src/modules/mcp/mcp-tool-result.util.ts`
- Create: `backend/src/modules/mcp/services/mcp-tools/leads.tools.ts`
- Test: `backend/src/modules/mcp/services/mcp-tools/leads.tools.spec.ts`
- Modify: `backend/src/modules/mcp/services/mcp-server.service.ts`
- Modify: `backend/src/modules/mcp/mcp.module.ts` (import `LeadsModule`, inject `LeadsService`)

**Interfaces:**
- Consumes: `LeadsService.list/getById/create/update` (`backend/src/modules/leads/services/leads.service.ts`), `createLeadSchema`/`updateLeadSchema` field constraints (`backend/src/modules/leads/leads.constants.ts`), `opportunityStageSchema` (`backend/src/modules/leads/dto/opportunity-stage.dto.ts`).
- Produces: `registerLeadsTools(server: McpServer, deps: { leadsService: LeadsService }, customerId: string): void`. Also produces `textResult(payload: unknown)` from the new shared util — consumed by Tasks 5 and 6 as well (all three tool-group files share this one helper instead of each redefining it).

- [ ] **Step 0: Shared tool-result helper**

```ts
// backend/src/modules/mcp/mcp-tool-result.util.ts
// Every MCP tool handler in this module returns its payload the same way —
// as a single JSON-stringified text content block. Shared here so
// leads/lead-notes/lead-reminders tool files don't each redefine it.
export function textResult(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload) }] };
}
```

- [ ] **Step 1: Write the failing unit tests for the tool handlers**

```ts
// backend/src/modules/mcp/services/mcp-tools/leads.tools.spec.ts
import { NotFoundException } from '@nestjs/common';
import type { LeadsService } from '../../../leads/services/leads.service';
import {
  createLeadHandler,
  getLeadHandler,
  listLeadsHandler,
  updateLeadHandler,
} from './leads.tools';

describe('leads MCP tool handlers', () => {
  function mockLeadsService(): jest.Mocked<LeadsService> {
    return {
      list: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<LeadsService>;
  }

  describe('listLeadsHandler', () => {
    it('scopes the list to the given customerId', async () => {
      const leadsService = mockLeadsService();
      leadsService.list.mockResolvedValue([]);

      await listLeadsHandler(leadsService, 'customer-1', {});

      expect(leadsService.list).toHaveBeenCalledWith('customer-1', {});
    });
  });

  describe('getLeadHandler', () => {
    it('returns lead detail scoped to the customer', async () => {
      const leadsService = mockLeadsService();
      leadsService.getById.mockResolvedValue({
        id: 'lead-1',
        name: 'Ada',
      } as never);

      const result = await getLeadHandler(leadsService, 'customer-1', {
        leadId: 'lead-1',
      });

      expect(leadsService.getById).toHaveBeenCalledWith('customer-1', 'lead-1');
      expect(result.content[0].text).toContain('Ada');
    });

    it('propagates NotFoundException for a lead the customer does not own', async () => {
      const leadsService = mockLeadsService();
      leadsService.getById.mockRejectedValue(
        new NotFoundException('Lead not found'),
      );

      await expect(
        getLeadHandler(leadsService, 'customer-1', { leadId: 'lead-2' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLeadHandler', () => {
    it('creates a lead scoped to the customer', async () => {
      const leadsService = mockLeadsService();
      leadsService.create.mockResolvedValue({ id: 'lead-1', name: 'Ada' } as never);

      const result = await createLeadHandler(leadsService, 'customer-1', {
        name: 'Ada',
      });

      expect(leadsService.create).toHaveBeenCalledWith('customer-1', {
        name: 'Ada',
      });
      expect(result.content[0].text).toContain('lead-1');
    });
  });

  describe('updateLeadHandler', () => {
    it('updates a lead scoped to the customer', async () => {
      const leadsService = mockLeadsService();
      leadsService.update.mockResolvedValue({
        id: 'lead-1',
        stage: 'QUALIFIED_LEAD',
      } as never);

      const result = await updateLeadHandler(leadsService, 'customer-1', {
        leadId: 'lead-1',
        stage: 'QUALIFIED_LEAD',
      });

      expect(leadsService.update).toHaveBeenCalledWith('customer-1', 'lead-1', {
        stage: 'QUALIFIED_LEAD',
      });
      expect(result.content[0].text).toContain('QUALIFIED_LEAD');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest leads.tools.spec.ts`
Expected: FAIL — `leads.tools.ts` doesn't exist yet.

- [ ] **Step 3: Implement `leads.tools.ts`**

```ts
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  LEAD_COMPANY_MAX_LENGTH,
  LEAD_EMAIL_MAX_LENGTH,
  LEAD_EMAIL_REGEX,
  LEAD_NAME_MAX_LENGTH,
  LEAD_NOTE_MAX_LENGTH,
  LEAD_PHONE_DIAL_CODE_MAX_LENGTH,
  LEAD_PHONE_NUMBER_DIGITS_REGEX,
  LEAD_PHONE_NUMBER_MAX_DIGITS,
  LEAD_PHONE_NUMBER_MIN_DIGITS,
  LEAD_PROFESSION_MAX_LENGTH,
} from '../../../leads/leads.constants';
import { opportunityStageSchema } from '../../../leads/dto/opportunity-stage.dto';
import type { LeadsService } from '../../../leads/services/leads.service';
import type { CreateLeadDto } from '../../../leads/dto/create-lead.dto';
import type { ListLeadsQueryDto } from '../../../leads/dto/list-leads-query.dto';
import type { UpdateLeadDto } from '../../../leads/dto/update-lead.dto';
import { textResult } from '../../mcp-tool-result.util';

const listLeadsInputSchema = z.object({
  folderId: z.string().uuid().optional(),
});

const getLeadInputSchema = z.object({
  leadId: z.string().uuid(),
});

const createLeadInputSchema = z.object({
  name: z.string().trim().min(1).max(LEAD_NAME_MAX_LENGTH),
  email: z.string().trim().max(LEAD_EMAIL_MAX_LENGTH).regex(LEAD_EMAIL_REGEX).optional(),
  countryDialCode: z.string().trim().min(1).max(LEAD_PHONE_DIAL_CODE_MAX_LENGTH).optional(),
  phoneNumber: z
    .string()
    .trim()
    .regex(LEAD_PHONE_NUMBER_DIGITS_REGEX)
    .min(LEAD_PHONE_NUMBER_MIN_DIGITS)
    .max(LEAD_PHONE_NUMBER_MAX_DIGITS)
    .optional(),
  note: z.string().trim().max(LEAD_NOTE_MAX_LENGTH).optional(),
  company: z.string().trim().max(LEAD_COMPANY_MAX_LENGTH).optional(),
  profession: z.string().trim().max(LEAD_PROFESSION_MAX_LENGTH).optional(),
});

const updateLeadInputSchema = z.object({
  leadId: z.string().uuid(),
  name: z.string().trim().min(1).max(LEAD_NAME_MAX_LENGTH).optional(),
  email: z.string().trim().max(LEAD_EMAIL_MAX_LENGTH).regex(LEAD_EMAIL_REGEX).optional(),
  note: z.string().trim().max(LEAD_NOTE_MAX_LENGTH).optional(),
  stage: opportunityStageSchema.optional(),
});

export async function listLeadsHandler(
  leadsService: LeadsService,
  customerId: string,
  args: ListLeadsQueryDto,
) {
  const leads = await leadsService.list(customerId, args);
  return textResult(leads);
}

export async function getLeadHandler(
  leadsService: LeadsService,
  customerId: string,
  args: z.infer<typeof getLeadInputSchema>,
) {
  const lead = await leadsService.getById(customerId, args.leadId);
  return textResult(lead);
}

export async function createLeadHandler(
  leadsService: LeadsService,
  customerId: string,
  args: CreateLeadDto,
) {
  const lead = await leadsService.create(customerId, args);
  return textResult(lead);
}

export async function updateLeadHandler(
  leadsService: LeadsService,
  customerId: string,
  args: { leadId: string } & UpdateLeadDto,
) {
  const { leadId, ...dto } = args;
  const lead = await leadsService.update(customerId, leadId, dto);
  return textResult(lead);
}

export function registerLeadsTools(
  server: McpServer,
  deps: { leadsService: LeadsService },
  customerId: string,
): void {
  server.registerTool(
    'list_leads',
    {
      description: "List the caller's leads, optionally filtered by folder.",
      inputSchema: listLeadsInputSchema,
    },
    (args) => listLeadsHandler(deps.leadsService, customerId, args),
  );

  server.registerTool(
    'get_lead',
    {
      description:
        'Fetch full detail for one lead by id, including its custom form answers — use this before drafting a personalized message.',
      inputSchema: getLeadInputSchema,
    },
    (args) => getLeadHandler(deps.leadsService, customerId, args),
  );

  server.registerTool(
    'create_lead',
    {
      description: 'Create a new lead.',
      inputSchema: createLeadInputSchema,
    },
    (args) => createLeadHandler(deps.leadsService, customerId, args),
  );

  server.registerTool(
    'update_lead',
    {
      description:
        "Update a lead's fields, including its pipeline stage (status) — e.g. moving it to QUALIFIED_LEAD or CLOSED_WON.",
      inputSchema: updateLeadInputSchema,
    },
    (args) => updateLeadHandler(deps.leadsService, customerId, args),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest leads.tools.spec.ts`
Expected: PASS

- [ ] **Step 5: Wire `registerLeadsTools` into `McpServerService`**

```ts
import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LeadsService } from '../../leads/services/leads.service';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from '../mcp.constants';
import { registerLeadsTools } from './mcp-tools/leads.tools';

@Injectable()
export class McpServerService {
  constructor(private readonly leadsService: LeadsService) {}

  createServer(customerId: string): McpServer {
    const server = new McpServer({
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    });

    registerLeadsTools(server, { leadsService: this.leadsService }, customerId);

    return server;
  }
}
```

Update `mcp-server.service.spec.ts`'s instantiation to `new McpServerService(mockLeadsService())` (a minimal mock satisfying the constructor).

- [ ] **Step 6: Import `LeadsModule` in `mcp.module.ts`**

```ts
import { LeadsModule } from '../leads/leads.module';
// ...
@Module({
  imports: [CustomersModule, LeadsModule],
  providers: [McpServerService],
  exports: [McpServerService],
})
export class McpModule {}
```

- [ ] **Step 7: Run the full backend test suite for this module and build**

Run: `cd backend && npx jest modules/mcp && npm run build`
Expected: PASS / clean build.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/mcp
git commit -m "feat(mcp): add leads list/get/create/update tools"
```

---

## Task 5: Lead reference-notes MCP tools

**Files:**
- Create: `backend/src/modules/mcp/services/mcp-tools/lead-notes.tools.ts`
- Test: `backend/src/modules/mcp/services/mcp-tools/lead-notes.tools.spec.ts`
- Modify: `backend/src/modules/mcp/services/mcp-server.service.ts`

**Interfaces:**
- Consumes: `LeadReferenceNotesService.list/create` (`backend/src/modules/leads/services/lead-reference-notes.service.ts`), `LEAD_REFERENCE_NOTE_CONTENT_MAX_LENGTH` (`leads.constants.ts`).
- Produces: `registerLeadNoteTools(server, deps: { leadReferenceNotesService }, customerId): void`.

- [ ] **Step 1: Write the failing unit tests**

```ts
// backend/src/modules/mcp/services/mcp-tools/lead-notes.tools.spec.ts
import type { LeadReferenceNotesService } from '../../../leads/services/lead-reference-notes.service';
import { addLeadNoteHandler, listLeadNotesHandler } from './lead-notes.tools';

describe('lead notes MCP tool handlers', () => {
  function mockService(): jest.Mocked<LeadReferenceNotesService> {
    return {
      list: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<LeadReferenceNotesService>;
  }

  it('listLeadNotesHandler lists notes for the given lead scoped to the customer', async () => {
    const service = mockService();
    service.list.mockResolvedValue([]);

    await listLeadNotesHandler(service, 'customer-1', { leadId: 'lead-1' });

    expect(service.list).toHaveBeenCalledWith('customer-1', 'lead-1');
  });

  it('addLeadNoteHandler creates a note scoped to the customer and lead', async () => {
    const service = mockService();
    service.create.mockResolvedValue({ id: 'note-1', content: 'Called' } as never);

    const result = await addLeadNoteHandler(service, 'customer-1', {
      leadId: 'lead-1',
      content: 'Called',
    });

    expect(service.create).toHaveBeenCalledWith('customer-1', 'lead-1', {
      content: 'Called',
    });
    expect(result.content[0].text).toContain('note-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest lead-notes.tools.spec.ts`
Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement `lead-notes.tools.ts`**

```ts
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LEAD_REFERENCE_NOTE_CONTENT_MAX_LENGTH } from '../../../leads/leads.constants';
import type { LeadReferenceNotesService } from '../../../leads/services/lead-reference-notes.service';
import { textResult } from '../../mcp-tool-result.util';

const listLeadNotesInputSchema = z.object({ leadId: z.string().uuid() });
const addLeadNoteInputSchema = z.object({
  leadId: z.string().uuid(),
  content: z.string().trim().min(1).max(LEAD_REFERENCE_NOTE_CONTENT_MAX_LENGTH),
});

export async function listLeadNotesHandler(
  service: LeadReferenceNotesService,
  customerId: string,
  args: z.infer<typeof listLeadNotesInputSchema>,
) {
  const notes = await service.list(customerId, args.leadId);
  return textResult(notes);
}

export async function addLeadNoteHandler(
  service: LeadReferenceNotesService,
  customerId: string,
  args: z.infer<typeof addLeadNoteInputSchema>,
) {
  const { leadId, ...dto } = args;
  const note = await service.create(customerId, leadId, dto);
  return textResult(note);
}

export function registerLeadNoteTools(
  server: McpServer,
  deps: { leadReferenceNotesService: LeadReferenceNotesService },
  customerId: string,
): void {
  server.registerTool(
    'list_lead_notes',
    {
      description: 'List reference notes on a lead.',
      inputSchema: listLeadNotesInputSchema,
    },
    (args) => listLeadNotesHandler(deps.leadReferenceNotesService, customerId, args),
  );

  server.registerTool(
    'add_lead_note',
    {
      description: 'Add a reference note to a lead (e.g. a call summary).',
      inputSchema: addLeadNoteInputSchema,
    },
    (args) => addLeadNoteHandler(deps.leadReferenceNotesService, customerId, args),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest lead-notes.tools.spec.ts`
Expected: PASS

- [ ] **Step 5: Wire into `McpServerService`**

```ts
constructor(
  private readonly leadsService: LeadsService,
  private readonly leadReferenceNotesService: LeadReferenceNotesService,
) {}

createServer(customerId: string): McpServer {
  const server = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });
  registerLeadsTools(server, { leadsService: this.leadsService }, customerId);
  registerLeadNoteTools(
    server,
    { leadReferenceNotesService: this.leadReferenceNotesService },
    customerId,
  );
  return server;
}
```

- [ ] **Step 6: Run module tests + build**

Run: `cd backend && npx jest modules/mcp && npm run build`

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/mcp
git commit -m "feat(mcp): add lead reference-note list/add tools"
```

---

## Task 6: Lead reminders MCP tools

**Files:**
- Create: `backend/src/modules/mcp/services/mcp-tools/lead-reminders.tools.ts`
- Test: `backend/src/modules/mcp/services/mcp-tools/lead-reminders.tools.spec.ts`
- Modify: `backend/src/modules/mcp/services/mcp-server.service.ts`

**Interfaces:**
- Consumes: `RemindersService.list/create/getDue` (`backend/src/modules/leads/services/reminders.service.ts`), `LEAD_REMINDER_TITLE_MAX_LENGTH`/`LEAD_REMINDER_TEXT_MAX_LENGTH`/`REMINDER_DUE_WINDOW_DEFAULT_MINUTES`/`REMINDER_DUE_WINDOW_MAX_MINUTES` (`leads.constants.ts`).
- Produces: `registerLeadReminderTools(server, deps: { remindersService }, customerId): void`.

- [ ] **Step 1: Write the failing unit tests**

```ts
// backend/src/modules/mcp/services/mcp-tools/lead-reminders.tools.spec.ts
import type { RemindersService } from '../../../leads/services/reminders.service';
import {
  addLeadReminderHandler,
  listDueRemindersHandler,
  listLeadRemindersHandler,
} from './lead-reminders.tools';

describe('lead reminders MCP tool handlers', () => {
  function mockService(): jest.Mocked<RemindersService> {
    return {
      list: jest.fn(),
      create: jest.fn(),
      getDue: jest.fn(),
    } as unknown as jest.Mocked<RemindersService>;
  }

  it('listLeadRemindersHandler lists reminders for the lead scoped to the customer', async () => {
    const service = mockService();
    service.list.mockResolvedValue([]);

    await listLeadRemindersHandler(service, 'customer-1', { leadId: 'lead-1' });

    expect(service.list).toHaveBeenCalledWith('customer-1', 'lead-1');
  });

  it('addLeadReminderHandler creates a reminder scoped to the customer and lead', async () => {
    const service = mockService();
    const triggerAt = new Date('2026-09-10T09:00:00.000Z');
    service.create.mockResolvedValue({ id: 'reminder-1', title: 'Call back' } as never);

    const result = await addLeadReminderHandler(service, 'customer-1', {
      leadId: 'lead-1',
      title: 'Call back',
      triggerAt: triggerAt.toISOString(),
    });

    expect(service.create).toHaveBeenCalledWith('customer-1', 'lead-1', {
      title: 'Call back',
      triggerAt,
    });
    expect(result.content[0].text).toContain('reminder-1');
  });

  it('listDueRemindersHandler defaults withinMinutes and scopes to the customer', async () => {
    const service = mockService();
    service.getDue.mockResolvedValue([]);

    await listDueRemindersHandler(service, 'customer-1', {});

    expect(service.getDue).toHaveBeenCalledWith('customer-1', 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest lead-reminders.tools.spec.ts`
Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement `lead-reminders.tools.ts`**

```ts
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  LEAD_REMINDER_TEXT_MAX_LENGTH,
  LEAD_REMINDER_TITLE_MAX_LENGTH,
  REMINDER_DUE_WINDOW_DEFAULT_MINUTES,
  REMINDER_DUE_WINDOW_MAX_MINUTES,
} from '../../../leads/leads.constants';
import type { RemindersService } from '../../../leads/services/reminders.service';
import { textResult } from '../../mcp-tool-result.util';

const listLeadRemindersInputSchema = z.object({ leadId: z.string().uuid() });

const addLeadReminderInputSchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().trim().min(1).max(LEAD_REMINDER_TITLE_MAX_LENGTH),
  text: z.string().trim().max(LEAD_REMINDER_TEXT_MAX_LENGTH).optional(),
  triggerAt: z.coerce.date(),
});

const listDueRemindersInputSchema = z.object({
  withinMinutes: z
    .number()
    .int()
    .min(0)
    .max(REMINDER_DUE_WINDOW_MAX_MINUTES)
    .default(REMINDER_DUE_WINDOW_DEFAULT_MINUTES)
    .optional(),
});

export async function listLeadRemindersHandler(
  service: RemindersService,
  customerId: string,
  args: z.infer<typeof listLeadRemindersInputSchema>,
) {
  const reminders = await service.list(customerId, args.leadId);
  return textResult(reminders);
}

export async function addLeadReminderHandler(
  service: RemindersService,
  customerId: string,
  args: { leadId: string; title: string; text?: string; triggerAt: string },
) {
  const reminder = await service.create(customerId, args.leadId, {
    title: args.title,
    text: args.text,
    triggerAt: new Date(args.triggerAt),
  });
  return textResult(reminder);
}

export async function listDueRemindersHandler(
  service: RemindersService,
  customerId: string,
  args: z.infer<typeof listDueRemindersInputSchema>,
) {
  const reminders = await service.getDue(
    customerId,
    args.withinMinutes ?? REMINDER_DUE_WINDOW_DEFAULT_MINUTES,
  );
  return textResult(reminders);
}

export function registerLeadReminderTools(
  server: McpServer,
  deps: { remindersService: RemindersService },
  customerId: string,
): void {
  server.registerTool(
    'list_lead_reminders',
    {
      description: 'List reminders set on a lead.',
      inputSchema: listLeadRemindersInputSchema,
    },
    (args) => listLeadRemindersHandler(deps.remindersService, customerId, args),
  );

  server.registerTool(
    'add_lead_reminder',
    {
      description: 'Add a reminder to a lead, due at a specific time.',
      inputSchema: addLeadReminderInputSchema,
    },
    (args) => addLeadReminderHandler(deps.remindersService, customerId, args),
  );

  server.registerTool(
    'list_due_reminders',
    {
      description:
        'List reminders across all of the caller\'s leads that are due within a time window (default: overdue/now).',
      inputSchema: listDueRemindersInputSchema,
    },
    (args) => listDueRemindersHandler(deps.remindersService, customerId, args),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest lead-reminders.tools.spec.ts`
Expected: PASS

- [ ] **Step 5: Wire into `McpServerService`**

```ts
constructor(
  private readonly leadsService: LeadsService,
  private readonly leadReferenceNotesService: LeadReferenceNotesService,
  private readonly remindersService: RemindersService,
) {}

createServer(customerId: string): McpServer {
  const server = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });
  registerLeadsTools(server, { leadsService: this.leadsService }, customerId);
  registerLeadNoteTools(server, { leadReferenceNotesService: this.leadReferenceNotesService }, customerId);
  registerLeadReminderTools(server, { remindersService: this.remindersService }, customerId);
  return server;
}
```

- [ ] **Step 6: Run module tests + build**

Run: `cd backend && npx jest modules/mcp && npm run build`

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/mcp
git commit -m "feat(mcp): add lead reminder add/list/due tools"
```

---

## Task 7: Rate limiting on the new OAuth/MCP surface

**Files:**
- Modify: `backend/src/main.ts`
- Create: `backend/src/common/config/rate-limit.constants.ts`
- Modify: `backend/.env`, `backend/.env.template` (none needed — limits are fixed constants, not env-configurable, per backend/CLAUDE.md's constants-vs-env distinction)

**Interfaces:**
- Produces: nothing consumed elsewhere — this is a self-contained middleware mount.

**Note:** `@nestjs/throttler`'s `ThrottlerGuard` only intercepts requests that pass through Nest's own controller/routing pipeline. The employee/customer auth mounts and the new `/api/mcp`/`/oauth2/*` routes are all mounted directly on the raw Express adapter via `httpAdapter.all/use/post(...)` in `main.ts`, bypassing Nest's routing entirely — so a Nest guard would never run for them. Plain Express middleware is the correct tool here.

- [ ] **Step 1: `npm install express-rate-limit` in `backend/`**

Run: `cd backend && npm install express-rate-limit`

- [ ] **Step 2: `rate-limit.constants.ts`**

```ts
// Applied to the OAuth authorization-server + MCP endpoints only (main.ts) —
// these are mounted directly on the raw Express adapter (bypassing Nest's
// own routing/guard pipeline), so a Nest-level throttler guard can't reach
// them; plain Express rate-limiting middleware is used instead.
export const OAUTH_MCP_RATE_LIMIT_WINDOW_MS = 60_000;
export const OAUTH_MCP_RATE_LIMIT_MAX_REQUESTS = 100;
```

- [ ] **Step 3: Mount the limiter in `main.ts`**

```ts
import rateLimit from 'express-rate-limit';
import {
  OAUTH_MCP_RATE_LIMIT_MAX_REQUESTS,
  OAUTH_MCP_RATE_LIMIT_WINDOW_MS,
} from './common/config/rate-limit.constants';

// ...inside bootstrap(), before the customerAuth mount:
const oauthMcpRateLimiter = rateLimit({
  windowMs: OAUTH_MCP_RATE_LIMIT_WINDOW_MS,
  limit: OAUTH_MCP_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
});

httpAdapter.use(`${CUSTOMER_AUTH_BASE_PATH}/oauth2`, oauthMcpRateLimiter);
httpAdapter.use(MCP_BASE_PATH, oauthMcpRateLimiter);
```

Place this `httpAdapter.use(...)` for `${CUSTOMER_AUTH_BASE_PATH}/oauth2` **before** `httpAdapter.all(`${CUSTOMER_AUTH_BASE_PATH}/*splat`, ...)` so it runs first for that sub-path; place the `MCP_BASE_PATH` one immediately before the MCP auth-middleware mount from Task 3.

- [ ] **Step 4: Manual verification**

Run the backend locally and fire >100 requests within a minute at `/api/mcp` (e.g. `for i in $(seq 1 105); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/mcp; done`) — confirm the tail of the responses switch to `429`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main.ts backend/src/common/config/rate-limit.constants.ts backend/package.json backend/package-lock.json
git commit -m "feat(mcp): rate-limit the new oauth2/mcp endpoints"
```

---

## Task 8: Backend integration test — full OAuth + MCP flow

**Files:**
- Create: `backend/test/integration/mcp-oauth-leads.e2e-spec.ts`

**Interfaces:**
- Consumes: `CUSTOMER_AUTH_BASE_PATH`, `MCP_BASE_PATH` (Task 1), the full bootstrapped `AppModule` including the `main.ts` mounts (mirrors the pattern in `leads-crm-features.e2e-spec.ts`, extended with the MCP mount + rate limiter from Tasks 3/7).

- [ ] **Step 1: Write the test**

```ts
import { randomUUID } from 'crypto';
import express from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import {
  CUSTOMER_AUTH,
  CUSTOMER_AUTH_BASE_PATH,
  MCP_BASE_PATH,
} from '../../src/common/auth/auth.constants';
import type { CustomerAuth } from '../../src/common/auth/customer-auth.factory';
import { BetterAuthApiErrorFilter } from '../../src/common/filters/better-auth-api-error.filter';
import { AppConfigService } from '../../src/common/config/app-config.service';
import { createMcpAuthMiddleware } from '../../src/modules/mcp/mcp-auth.middleware';
import { createMcpHttpHandler } from '../../src/modules/mcp/mcp-http-handler';
import { McpServerService } from '../../src/modules/mcp/services/mcp-server.service';
import { CustomersService } from '../../src/modules/customers/services/customers.service';

describe('MCP + OAuth leads integration (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });

    const appConfig = app.get(AppConfigService);
    const customerAuth = app.get<CustomerAuth>(CUSTOMER_AUTH);
    const httpAdapter = app.getHttpAdapter().getInstance();
    httpAdapter.all(
      `${CUSTOMER_AUTH_BASE_PATH}/*splat`,
      toNodeHandler(customerAuth),
    );
    httpAdapter.use(express.json());
    httpAdapter.use(MCP_BASE_PATH, createMcpAuthMiddleware(appConfig.betterAuthUrl));
    httpAdapter.post(
      MCP_BASE_PATH,
      createMcpHttpHandler({
        mcpServerService: app.get(McpServerService),
        customersService: app.get(CustomersService),
      }),
    );
    app.useGlobalFilters(new BetterAuthApiErrorFilter());

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  async function signUpAndSignIn(): Promise<{ cookie: string }> {
    const email = `mcp-oauth-e2e-${randomUUID()}@example.com`;
    const password = `Passw0rd-${randomUUID()}`;

    const signUpResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/sign-up/email`)
      .send({ email, password, name: 'Test Customer' })
      .expect(200);
    seededAccountIds.push((signUpResponse.body as { user: { id: string } }).user.id);

    const signInResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/sign-in/email`)
      .send({ email, password })
      .expect(200);

    const setCookie = signInResponse.headers['set-cookie'] as unknown as string[];
    return { cookie: setCookie.map((c) => c.split(';')[0]).join('; ') };
  }

  it('rejects an unauthenticated MCP request with 401', async () => {
    await request(app.getHttpServer())
      .post(MCP_BASE_PATH)
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 1 })
      .expect(401);
  });

  it('registers a client, completes authorize+consent+PKCE+token, and calls a tool end-to-end', async () => {
    const { cookie } = await signUpAndSignIn();

    // Dynamic Client Registration
    const registerResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/oauth2/register`)
      .send({
        client_name: 'Integration Test Client',
        redirect_uris: ['http://127.0.0.1:9999/callback'],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
      })
      .expect(201);
    const clientId = (registerResponse.body as { client_id: string }).client_id;

    // PKCE
    const codeVerifier = randomUUID() + randomUUID();
    const crypto = await import('crypto');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const resource = `${process.env.PUBLIC_APP_BASE_URL}${MCP_BASE_PATH}`;

    // Authorize (signed-in session via cookie) -> expect a redirect toward the
    // configured consentPage carrying a consent_code
    const authorizeResponse = await request(app.getHttpServer())
      .get(`${CUSTOMER_AUTH_BASE_PATH}/oauth2/authorize`)
      .set('Cookie', cookie)
      .query({
        client_id: clientId,
        redirect_uri: 'http://127.0.0.1:9999/callback',
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        resource,
      })
      .expect(302);
    const consentLocation = new URL(
      authorizeResponse.headers.location as string,
      'http://localhost',
    );
    const consentCode = consentLocation.searchParams.get('consent_code')!;

    // Consent
    await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/oauth2/consent`)
      .set('Cookie', cookie)
      .send({ accept: true, consent_code: consentCode })
      .expect(200);

    // Note: the exact response shape carrying the authorization code back
    // (redirect vs. JSON body) depends on the live plugin behavior — adjust
    // this extraction once run against the real endpoint; the remainder of
    // the flow (token exchange, tool call) is unaffected by which shape it
    // takes.
  });

  it('a lead created by one customer is never visible to another over MCP', async () => {
    // Seed two customers directly (bypassing the OAuth dance, since this
    // test only needs two resolvable customerIds to exercise the handler
    // layer's ownership scoping — already covered end-to-end by the test
    // above for the OAuth layer itself).
    const accountA = await prisma.customerAccount.create({
      data: { name: 'A', email: `mcp-a-${randomUUID()}@example.com`, emailVerified: true },
    });
    const accountB = await prisma.customerAccount.create({
      data: { name: 'B', email: `mcp-b-${randomUUID()}@example.com`, emailVerified: true },
    });
    seededAccountIds.push(accountA.id, accountB.id);
    const customerA = await prisma.customer.create({ data: { accountId: accountA.id } });
    const customerB = await prisma.customer.create({ data: { accountId: accountB.id } });

    const lead = await prisma.lead.create({
      data: { customerId: customerA.id, name: 'A-only lead' },
    });

    const mcpServerService = app.get(McpServerService);
    const serverForB = mcpServerService.createServer(customerB.id);
    expect(serverForB).toBeDefined();

    // The registered get_lead tool for customer B calls LeadsService.getById
    // with customerB.id, which throws NotFoundException for a lead owned by
    // customer A — verified directly against the service (the same call the
    // tool handler makes), since driving this through a live JSON-RPC
    // tools/call request requires a valid bearer token from the full OAuth
    // dance covered in the test above.
    const leadsService = app.get(CustomersService); // placeholder import position
    void leadsService;
    void lead;
  });
});
```

- [ ] **Step 2: Run the test, fix the two flagged approximations against real behavior**

Run: `cd backend && npx jest mcp-oauth-leads.e2e-spec.ts`

This test exercises live, newly-installed third-party plugin behavior (`@better-auth/mcp`'s exact `/oauth2/authorize` → consent-code → `/oauth2/consent` → `/oauth2/token` response shapes) that isn't fully pinned down from documentation alone. Run it, read the actual responses, and adjust the two noted spots (consent-code extraction, and completing the token exchange + a real `tools/call` request in the last test) to match. Do not leave the test passing on a weakened assertion — the required end state is: registration → authorize → consent → token exchange → an authenticated `tools/call` for `get_lead` succeeds for the owning customer and 404s (via the JSON-RPC error content) for a different customer's lead ID.

- [ ] **Step 3: Run full backend suite**

Run: `cd backend && npm run lint && npm run build && npm test`
Expected: all clean/green.

- [ ] **Step 4: Commit**

```bash
git add backend/test/integration/mcp-oauth-leads.e2e-spec.ts
git commit -m "test(mcp): add end-to-end OAuth + MCP leads integration test"
```

---

## Task 9: Frontend — auth service, types, endpoints, routes

**Files:**
- Modify: `frontend/src/config/api.ts`
- Modify: `frontend/src/config/routes.ts`
- Modify: `frontend/src/types/auth.ts`
- Modify: `frontend/src/services/authService.ts`

**Interfaces:**
- Produces: `AUTH_ENDPOINTS.oauthPublicClient/oauthConsent/oauthGetConsents/oauthDeleteConsent`, `ROUTES.oauthAuthorize`/`ROUTES.userConnectedApps`, `OAuthPublicClient`/`OAuthConsent` types, and `getOAuthPublicClient`/`submitOAuthConsent`/`getOAuthConsents`/`revokeOAuthConsent` functions — consumed by Tasks 10 and 11.

- [ ] **Step 1: Add endpoint constants to `api.ts`**

```ts
export const AUTH_ENDPOINTS = {
  signUp: `${AUTH_BASE_PATH}/sign-up/email`,
  signIn: `${AUTH_BASE_PATH}/sign-in/email`,
  signInSocial: `${AUTH_BASE_PATH}/sign-in/social`,
  signOut: `${AUTH_BASE_PATH}/sign-out`,
  session: `${AUTH_BASE_PATH}/get-session`,
  updateUser: `${AUTH_BASE_PATH}/update-user`,
  oauthPublicClient: `${AUTH_BASE_PATH}/oauth2/public-client`,
  oauthConsent: `${AUTH_BASE_PATH}/oauth2/consent`,
  oauthGetConsents: `${AUTH_BASE_PATH}/oauth2/get-consents`,
  oauthDeleteConsent: `${AUTH_BASE_PATH}/oauth2/delete-consent`,
} as const;
```

- [ ] **Step 2: Add routes to `routes.ts`**

```ts
export const ROUTES = {
  // ...existing entries...
  oauthAuthorize: "/oauth/authorize",
  userConnectedApps: "/user/apps/connected-apps",
  // ...rest unchanged...
} as const;
```

- [ ] **Step 3: Add types to `types/auth.ts`**

```ts
export interface OAuthPublicClient {
  clientId: string;
  clientName: string;
  logoUri: string | null;
}

export interface OAuthConsent {
  id: string;
  clientId: string;
  clientName: string | null;
  scope: string;
  createdAt: string;
}
```

Note: `OAuthPublicClient`/`OAuthConsent`'s exact field names come from `@better-auth/mcp`'s live `/oauth2/public-client` and `/oauth2/get-consents` responses, which weren't directly inspectable during planning — Task 10/Step 2 and Task 11/Step 2 call these endpoints for real against the dev server and correct these field names (and the `apiRequest` calls' response typing) to match before those tasks' tests are written.

- [ ] **Step 4: Add service functions to `authService.ts`**

```ts
import type { OAuthConsent, OAuthPublicClient /* ...existing imports... */ } from "@app-types/auth";

export function getOAuthPublicClient(clientId: string): Promise<OAuthPublicClient> {
  return apiRequest<OAuthPublicClient>(
    `${AUTH_ENDPOINTS.oauthPublicClient}?client_id=${encodeURIComponent(clientId)}`,
    { method: "GET" },
  );
}

export function submitOAuthConsent(payload: {
  accept: boolean;
  consentCode: string;
}): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(AUTH_ENDPOINTS.oauthConsent, {
    method: "POST",
    body: JSON.stringify({ accept: payload.accept, consent_code: payload.consentCode }),
  });
}

export function getOAuthConsents(): Promise<OAuthConsent[]> {
  return apiRequest<OAuthConsent[]>(AUTH_ENDPOINTS.oauthGetConsents, {
    method: "GET",
  });
}

export function revokeOAuthConsent(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(AUTH_ENDPOINTS.oauthDeleteConsent, {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
```

- [ ] **Step 5: `npm run lint && npm run build`**

Run: `cd frontend && npm run lint && npm run build`
Expected: clean (these are additive, unused-until-Task-10/11 exports — confirm no unused-export lint rule fires; if one does, it'll resolve naturally once Tasks 10/11 import them, so this step is really just confirming no *type* errors yet).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/config frontend/src/types/auth.ts frontend/src/services/authService.ts
git commit -m "feat(oauth): add oauth2 consent/connected-apps endpoints, types, routes"
```

---

## Task 10: Frontend — `/oauth/authorize` consent screen

**Files:**
- Create: `frontend/src/features/oauth-authorize/hooks/useOAuthAuthorize.ts`
- Create: `frontend/src/features/oauth-authorize/components/OAuthAuthorizeView.tsx`
- Create: `frontend/src/features/oauth-authorize/index.ts`
- Create: `frontend/src/pages/OAuthAuthorizePage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `getOAuthPublicClient`, `submitOAuthConsent` (Task 9), `useAuth()` (`@hooks/useAuth`), `AuthLayout` (`@layouts/AuthLayout`), `ROUTES.oauthAuthorize`/`ROUTES.login` (Task 9 / existing).
- Produces: `OAuthAuthorizeView` — self-contained, no other task consumes it.

- [ ] **Step 1: First, confirm the live response shapes**

Before writing the hook, start the backend dev server (with Tasks 1-3 already in place) and drive a real `GET .../oauth2/authorize?...` redirect by hand (browser or curl) to see the actual `consent_code`/`client_id`/`scope` query params on the redirect to `/oauth/authorize`, and call `GET .../oauth2/public-client?client_id=...` directly to see its real JSON shape. Update the `OAuthPublicClient` type (Task 9/Step 3) if it differs from the placeholder shape there.

- [ ] **Step 2: `useOAuthAuthorize.ts`**

```ts
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getOAuthPublicClient, submitOAuthConsent } from "@services/authService";
import type { OAuthPublicClient } from "@app-types/auth";

export type OAuthAuthorizeStatus =
  | "loading"
  | "error"
  | "ready"
  | "submitting"
  | "approved"
  | "denied";

export interface UseOAuthAuthorizeResult {
  status: OAuthAuthorizeStatus;
  client: OAuthPublicClient | null;
  error: string | null;
  approve: () => Promise<void>;
  deny: () => Promise<void>;
}

export function useOAuthAuthorize(): UseOAuthAuthorizeResult {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client_id");
  const consentCode = searchParams.get("consent_code");

  const [status, setStatus] = useState<OAuthAuthorizeStatus>("loading");
  const [client, setClient] = useState<OAuthPublicClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!clientId || !consentCode) {
      setError("This authorization link is missing required information.");
      setStatus("error");
      return;
    }

    getOAuthPublicClient(clientId)
      .then((result) => {
        if (!cancelled) {
          setClient(result);
          setStatus("ready");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load this request.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, consentCode]);

  async function decide(accept: boolean) {
    if (!consentCode) return;
    setStatus("submitting");
    try {
      await submitOAuthConsent({ accept, consentCode });
      setStatus(accept ? "approved" : "denied");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit your decision.");
      setStatus("error");
    }
  }

  return {
    status,
    client,
    error,
    approve: () => decide(true),
    deny: () => decide(false),
  };
}
```

- [ ] **Step 3: `OAuthAuthorizeView.tsx`**

```tsx
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useOAuthAuthorize } from "@features/oauth-authorize/hooks/useOAuthAuthorize";

export default function OAuthAuthorizeView() {
  const { status, client, error, approve, deny } = useOAuthAuthorize();

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm text-base-content/60">Loading request…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertTriangle className="h-10 w-10 text-error" />
        <h1 className="text-xl font-bold text-base-content">Can't complete this request</h1>
        <p className="text-sm text-base-content/60">{error}</p>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h1 className="text-xl font-bold text-base-content">Access granted</h1>
        <p className="text-sm text-base-content/60">
          You can close this window and return to {client?.clientName ?? "the app"}.
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <XCircle className="h-10 w-10 text-base-content/40" />
        <h1 className="text-xl font-bold text-base-content">Access denied</h1>
        <p className="text-sm text-base-content/60">You can close this window.</p>
      </div>
    );
  }

  const isSubmitting = status === "submitting";

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h1 className="mb-1 text-xl font-bold text-base-content sm:text-2xl">
          {client?.clientName ?? "This app"} wants to connect
        </h1>
        <p className="text-sm text-base-content/60">
          It will be able to view and manage your leads, notes, and reminders.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void approve()}
          className="btn min-h-11 w-full rounded-field border-none bg-primary text-sm font-semibold text-primary-content shadow-md hover:bg-primary/90 disabled:bg-base-300"
        >
          {isSubmitting ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Allow access"
          )}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void deny()}
          className="btn min-h-11 w-full rounded-field border border-base-300 bg-base-100 text-sm font-semibold text-base-content hover:bg-base-200"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `index.ts` barrel**

```ts
export { default as OAuthAuthorizeView } from "@features/oauth-authorize/components/OAuthAuthorizeView";
```

- [ ] **Step 5: `OAuthAuthorizePage.tsx`**

Does its own auth check (not `RequireAuth`, which doesn't preserve the return URL) — redirects to login with a `redirect` param carrying the full original URL (including its OAuth query params) so the user lands back here after signing in.

```tsx
import { useLocation, Navigate } from "react-router-dom";
import AuthLayout from "@layouts/AuthLayout";
import { OAuthAuthorizeView } from "@features/oauth-authorize";
import { useAuth } from "@hooks/useAuth";
import { ROUTES } from "@config/routes";

export default function OAuthAuthorizePage() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!user) {
    const redirectTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`${ROUTES.login}?redirect=${encodeURIComponent(redirectTo)}`}
        replace
      />
    );
  }

  return (
    <AuthLayout
      promoHeading={
        <>
          Connect Your
          <br />
          AI Assistant
        </>
      }
      promoSubtext="Let ChatGPT or Claude help you manage leads, notes, and reminders — securely, with your permission."
    >
      <OAuthAuthorizeView />
    </AuthLayout>
  );
}
```

- [ ] **Step 6: Wire `?redirect=` support into `LoginPage`/`LoginForm`**

`LoginForm` already accepts a `redirectTo` prop (`frontend/src/features/auth/components/LoginForm.tsx:31`). Check `frontend/src/pages/LoginPage.tsx` — if it doesn't already read a `redirect` query param and pass it through, add that (mirroring the existing `INVITE_TOKEN_QUERY_PARAM` handling pattern in the same file, if present) so `OAuthAuthorizePage`'s redirect round-trips correctly.

- [ ] **Step 7: Register the route in `App.tsx`**

Add as a flat (non-`RequireAuth`) route, since `OAuthAuthorizePage` does its own auth check:

```tsx
import OAuthAuthorizePage from "@pages/OAuthAuthorizePage";
// ...
<Route path={ROUTES.oauthAuthorize} element={<OAuthAuthorizePage />} />
```

- [ ] **Step 8: Manual verification with Playwright**

Start both dev servers. Using the real customer login credentials from `.env` (per this project's Playwright testing convention — never seeded ones), drive a real DCR + authorize redirect (via curl/manual construction, per Task 8's flow) to land on `/oauth/authorize?client_id=...&consent_code=...` in the browser, and verify: loading → ready state shows the client name, Allow/Deny both work and land on the approved/denied state.

- [ ] **Step 9: `npm run lint && npm run build`**

Run: `cd frontend && npm run lint && npm run build`

- [ ] **Step 10: Commit**

```bash
git add frontend/src/features/oauth-authorize frontend/src/pages/OAuthAuthorizePage.tsx frontend/src/App.tsx
git commit -m "feat(oauth): add /oauth/authorize consent screen"
```

---

## Task 11: Frontend — Connected Apps management page

**Files:**
- Create: `frontend/src/features/connected-apps/hooks/useConnectedApps.ts`
- Create: `frontend/src/features/connected-apps/components/ConnectedAppsView.tsx`
- Create: `frontend/src/features/connected-apps/index.ts`
- Create: `frontend/src/pages/UserConnectedAppsPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/features/user-dashboard/config/appsConfig.ts`

**Interfaces:**
- Consumes: `getOAuthConsents`, `revokeOAuthConsent` (Task 9), `USER_APP_TILES`/`UserAppTile` (`features/user-dashboard/config/appsConfig.ts`).

- [ ] **Step 1: Confirm the live `/oauth2/get-consents` response shape**

With Task 10's flow already exercised (at least one real consent granted), call `GET .../oauth2/get-consents` directly (with a signed-in session cookie) and confirm/correct the `OAuthConsent` type from Task 9/Step 3 against the real response before writing the hook.

- [ ] **Step 2: `useConnectedApps.ts`**

```ts
import { useCallback, useEffect, useState } from "react";
import { getOAuthConsents, revokeOAuthConsent } from "@services/authService";
import type { OAuthConsent } from "@app-types/auth";

export interface UseConnectedAppsResult {
  consents: OAuthConsent[];
  isLoading: boolean;
  error: string | null;
  revokingId: string | null;
  revoke: (id: string) => Promise<void>;
}

export function useConnectedApps(): UseConnectedAppsResult {
  const [consents, setConsents] = useState<OAuthConsent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getOAuthConsents();
      setConsents(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load connected apps.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = useCallback(
    async (id: string) => {
      setRevokingId(id);
      try {
        await revokeOAuthConsent(id);
        setConsents((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to revoke access.");
      } finally {
        setRevokingId(null);
      }
    },
    [],
  );

  return { consents, isLoading, error, revokingId, revoke };
}
```

- [ ] **Step 3: `ConnectedAppsView.tsx`**

```tsx
import { AlertTriangle, PlugZap, Trash2 } from "lucide-react";
import { useConnectedApps } from "@features/connected-apps/hooks/useConnectedApps";

export default function ConnectedAppsView() {
  const { consents, isLoading, error, revokingId, revoke } = useConnectedApps();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <AlertTriangle className="h-8 w-8 text-error" />
        <p className="text-sm text-base-content/60">{error}</p>
      </div>
    );
  }

  if (consents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <PlugZap className="h-8 w-8 text-base-content/30" />
        <p className="text-sm text-base-content/60">
          No AI apps connected yet. Connect ChatGPT or Claude from within that app to get
          started.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {consents.map((consent) => (
        <li
          key={consent.id}
          className="flex items-center justify-between gap-4 rounded-box border border-base-300 bg-base-100 p-4"
        >
          <div>
            <p className="font-semibold text-base-content">
              {consent.clientName ?? "Connected app"}
            </p>
            <p className="text-xs text-base-content/50">
              Connected {new Date(consent.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            type="button"
            aria-label={`Revoke access for ${consent.clientName ?? "connected app"}`}
            disabled={revokingId === consent.id}
            onClick={() => void revoke(consent.id)}
            className="btn btn-square btn-ghost min-h-11 min-w-11 text-error"
          >
            {revokingId === consent.id ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: `index.ts` barrel**

```ts
export { default as ConnectedAppsView } from "@features/connected-apps/components/ConnectedAppsView";
```

- [ ] **Step 5: `UserConnectedAppsPage.tsx`**

Check `frontend/src/pages/UserBulkMessengerPage.tsx` for the exact shell/header pattern this project's `/user/apps/*` pages use (page title, back button, container padding) and mirror it here wrapping `ConnectedAppsView`, titled "Connected Apps".

- [ ] **Step 6: Register the route in `App.tsx`**

Inside the existing `<Route element={<RequireAuth />}>` block, alongside the other `/user/apps/*` routes:

```tsx
<Route path={ROUTES.userConnectedApps} element={<UserConnectedAppsPage />} />
```

- [ ] **Step 7: Add a discoverability tile in `appsConfig.ts`**

```ts
import { ClipboardList, ImageIcon, Mail, PlugZap, Send } from "lucide-react";
// ...
export const USER_APP_TILES: UserAppTile[] = [
  // ...existing tiles...
  {
    id: "connected-apps",
    label: "Connected Apps",
    icon: PlugZap,
    route: ROUTES.userConnectedApps,
    // Not a paid feature — always available regardless of plan.
    isLocked: () => false,
  },
];
```

- [ ] **Step 8: Manual verification with Playwright**

Log in with real customer credentials, navigate to the Connected Apps tile from the dashboard, confirm empty state renders, then (after granting a connection via Task 10's flow) confirm it lists and revoke actually removes it from the list and from a subsequent `GET .../oauth2/get-consents`.

- [ ] **Step 9: `npm run lint && npm run build`**

Run: `cd frontend && npm run lint && npm run build`

- [ ] **Step 10: Commit**

```bash
git add frontend/src/features/connected-apps frontend/src/pages/UserConnectedAppsPage.tsx frontend/src/App.tsx frontend/src/features/user-dashboard/config/appsConfig.ts
git commit -m "feat(connected-apps): add Connected Apps management page"
```

---

## Task 12: Lead-card MCP-UI widget (optional enhancement)

**Files:**
- Create: `backend/src/modules/mcp/widgets/lead-card.widget.ts`
- Modify: `backend/src/modules/mcp/services/mcp-tools/leads.tools.ts` (attach the widget resource to `get_lead`)
- Modify: `backend/src/modules/mcp/services/mcp-server.service.ts` (register the resource)

**Interfaces:**
- Consumes: `LeadDetailResponse` shape (`backend/src/modules/leads/services/leads.service.ts`).

This task depends on `@mcp-ui/server`'s `createUIResource` and `@modelcontextprotocol/ext-apps/server`'s `registerAppTool`/`registerAppResource` APIs, which are newer and less stable than the core MCP SDK/better-auth surfaces the rest of this plan is grounded in. Treat this task as separable and safe to skip/defer without affecting Tasks 1-11 (`get_lead` already works and returns full data as plain text/JSON — this task only adds a visual card on top).

- [ ] **Step 1: `npm install @mcp-ui/server @modelcontextprotocol/ext-apps`**

Run: `cd backend && npm install @mcp-ui/server @modelcontextprotocol/ext-apps`

- [ ] **Step 2: Inspect the installed packages' actual API before writing code**

Run: `cd backend && cat node_modules/@mcp-ui/server/README.md node_modules/@modelcontextprotocol/ext-apps/README.md` (or open them) — confirm `createUIResource`'s exact signature and `registerAppTool`'s exact signature against what's shown in Task planning research (`createUIResource({ uri, content: { type: 'rawHtml', htmlString }, encoding: 'text' })`; `registerAppTool(server, name, { description, inputSchema, _meta: { ui: { resourceUri } } }, handler)`), since these are fast-moving packages and the exact API may have shifted since this plan was written.

- [ ] **Step 3: `lead-card.widget.ts`**

```ts
import { createUIResource } from '@mcp-ui/server';
import { LEAD_CARD_WIDGET_URI } from '../mcp.constants';

export function buildLeadCardWidget(lead: { name: string; email?: string | null; company?: string | null; stage?: string | null }) {
  const html = `
    <div style="font-family: system-ui, sans-serif; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 360px;">
      <h2 style="margin: 0 0 4px; font-size: 16px;">${escapeHtml(lead.name)}</h2>
      ${lead.company ? `<p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">${escapeHtml(lead.company)}</p>` : ''}
      ${lead.email ? `<p style="margin: 0; font-size: 13px;">${escapeHtml(lead.email)}</p>` : ''}
      ${lead.stage ? `<span style="display: inline-block; margin-top: 8px; padding: 2px 8px; border-radius: 999px; background: #eef2ff; color: #4338ca; font-size: 12px;">${escapeHtml(lead.stage)}</span>` : ''}
    </div>
  `;

  return createUIResource({
    uri: LEAD_CARD_WIDGET_URI,
    content: { type: 'rawHtml', htmlString: html },
    encoding: 'text',
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

Add `LEAD_CARD_WIDGET_URI = 'ui://bizvizcards/lead-card'` to `mcp.constants.ts`.

- [ ] **Step 4: Attach the widget to `get_lead` via `registerAppTool`**

Replace the plain `server.registerTool('get_lead', ...)` call in `leads.tools.ts` with `registerAppTool` from `@modelcontextprotocol/ext-apps/server`, per the confirmed signature from Step 2, setting `_meta.ui.resourceUri` to `LEAD_CARD_WIDGET_URI` and building the widget from the returned lead in the handler.

- [ ] **Step 5: Register the resource on the server**

In `mcp-server.service.ts`, after building the server, register the widget's UI resource via `registerAppResource` (or the equivalent confirmed in Step 2) so `LEAD_CARD_WIDGET_URI` resolves.

- [ ] **Step 6: Manual verification**

Since this is view-layer behavior tied to a specific host's rendering (ChatGPT's iframe sandbox / Claude's MCP Apps renderer), automated testing only covers "the tool still returns correct data" (already covered by Task 4's tests — confirm they still pass). Manually verify actual widget rendering per this plan's overall Verification section (Task 13), connecting a real ChatGPT/Claude session.

- [ ] **Step 7: Run tests + build**

Run: `cd backend && npx jest modules/mcp && npm run build`

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/mcp backend/package.json backend/package-lock.json
git commit -m "feat(mcp): add lead-card MCP-UI widget to get_lead"
```

---

## Task 13: Final verification

- [ ] **Step 1: Full backend check**

Run: `cd backend && npm run lint && npm run build && npm test`
Expected: all clean/green (per backend/CLAUDE.md's definition of done).

- [ ] **Step 2: Full frontend check**

Run: `cd frontend && npm run lint && npm run build`
Expected: zero errors, zero warnings (per frontend/CLAUDE.md's definition of done).

- [ ] **Step 3: Manual dev-server walkthrough**

Start both servers. Using real customer credentials from `.env`: sign up/sign in, drive the full DCR → authorize → consent → token → tool-call flow by hand once (a small script or Postman/Insomnia collection using the flow proven in Task 8's test is fine), and confirm the Connected Apps page reflects it and revocation works.

- [ ] **Step 4: Real-host verification**

Register the running MCP server (`https://<your-dev-tunnel-or-deployed-host>/api/mcp`) as a custom connector in Claude.ai, and as a connector in ChatGPT developer mode. Authorize with a real customer login and run each tool (`list_leads`, `get_lead`, `create_lead`, `update_lead`, `list_lead_notes`, `add_lead_note`, `list_lead_reminders`, `add_lead_reminder`, `list_due_reminders`) from both clients. This is the only way to confirm OAuth discovery and (if Task 12 was done) widget rendering actually work against the real hosts' live infrastructure.

- [ ] **Step 5: Update `backend/.env.template`**

Confirm no new secrets were introduced that need documenting (this plan adds no new env vars — `PUBLIC_APP_BASE_URL` already existed). If Task 1 or 7 ended up needing anything env-configurable after all, add it to both `.env` and `.env.template` now.
