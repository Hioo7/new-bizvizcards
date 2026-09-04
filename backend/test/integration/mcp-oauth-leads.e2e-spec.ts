import { randomUUID, randomBytes, createHash } from 'crypto';
import express from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AppConfigService } from '../../src/common/config/app-config.service';
import {
  CUSTOMER_AUTH,
  CUSTOMER_AUTH_BASE_PATH,
  MCP_ALL_SCOPES,
  MCP_BASE_PATH,
  OAUTH_AUTHORIZATION_SERVER_METADATA_PATH,
  OAUTH_PROTECTED_RESOURCE_METADATA_PATH,
  OPENID_CONFIGURATION_METADATA_PATH,
} from '../../src/common/auth/auth.constants';
import type { CustomerAuth } from '../../src/common/auth/customer-auth.factory';
import { registerAuthHttpMounts } from '../../src/common/auth/register-auth-http-mounts';
import { BetterAuthApiErrorFilter } from '../../src/common/filters/better-auth-api-error.filter';
import { createMcpFetchHandler } from '../../src/modules/mcp/mcp-http-handler';
import { McpServerService } from '../../src/modules/mcp/services/mcp-server.service';
import { CustomersService } from '../../src/modules/customers/services/customers.service';

// A dedicated port for this file's real HTTP listener (see beforeAll) —
// distinct from BETTER_AUTH_URL's configured port (3000) so this test never
// collides with a concurrently-running dev server.
const MCP_E2E_TEST_PORT = 3987;

// Converts the Fetch-standard (Request) => Promise<Response> handler used in
// production (see main.ts) into a plain Node handler for this test's Express
// app — re-stringifies req.body since express.json() has already run here
// (unlike production, where the MCP handler reads the raw stream).
function toExpressHandler(
  fetchHandler: (request: Request) => Promise<Response>,
) {
  return async (req: express.Request, res: express.Response) => {
    const url = `http://${req.headers.host}${req.originalUrl}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
      else headers.append(key, value);
    }
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const fetchRequest = new Request(url, {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body) : undefined,
    });
    const fetchResponse = await fetchHandler(fetchRequest);
    res.status(fetchResponse.status);
    fetchResponse.headers.forEach((value, key) => res.setHeader(key, value));
    const text = await fetchResponse.text();
    res.send(text);
  };
}

describe('MCP + OAuth leads integration (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let mcpResource: string;
  let trustedOrigin: string;
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

    appConfig = app.get(AppConfigService);
    mcpResource = `${appConfig.publicAppBaseUrl}${MCP_BASE_PATH}`;
    trustedOrigin = appConfig.corsAllowedOrigins[0];

    const customerAuth = app.get<CustomerAuth>(CUSTOMER_AUTH);
    const httpAdapter = app.getHttpAdapter().getInstance();
    // Same shared wiring main.ts uses (CORS, rate limiting, the better-auth
    // `all()` handler, the root-relative discovery-document routes) so this
    // test exercises the real mount surface. The MCP POST is mounted below,
    // after express.json(), because this test parses the body first (see
    // toExpressHandler) unlike production.
    registerAuthHttpMounts(httpAdapter, { customerAuth });
    httpAdapter.use(express.json());
    // requireMcpAuth's token verification does a real network fetch back to
    // the auth server's own JWKS endpoint — supertest's default in-memory
    // dispatch (app.init() alone) never binds a port, so that fetch would
    // fail with "fetch failed". A dedicated fixed test port (distinct from
    // BETTER_AUTH_URL's real port 3000) avoids colliding with a
    // concurrently-running dev server; Express routes must be registered
    // before listen() (Nest's own routing finalizes at that point), so the
    // port is fixed up front rather than reading back an ephemeral one. The
    // `iss` claim baked into tokens still comes from customerAuth's real
    // configured baseURL (unaffected by this), so only the JWKS *fetch
    // target* needs pointing at this dedicated port.
    const jwksUrl = `http://localhost:${MCP_E2E_TEST_PORT}${CUSTOMER_AUTH_BASE_PATH}/jwks`;
    httpAdapter.post(
      MCP_BASE_PATH,
      toExpressHandler(
        createMcpFetchHandler({
          customerAuth,
          mcpServerService: app.get(McpServerService),
          customersService: app.get(CustomersService),
          resource: mcpResource,
          jwksUrl,
        }),
      ),
    );
    app.useGlobalFilters(new BetterAuthApiErrorFilter());

    await app.listen(MCP_E2E_TEST_PORT);
    prisma = app.get(PrismaService);

    // The mcp() plugin seeds its OauthResource row once (at construction) and
    // never re-syncs allowedScopes on a later config change — prod handles that
    // via backfillOauthResourceAllowedScopes on startup. Do the equivalent here
    // so a stale row left by an earlier run (e.g. before `openid` was added)
    // can't make the scope-grant assertions flaky.
    await prisma.oauthResource.updateMany({
      where: { identifier: mcpResource },
      data: { allowedScopes: [...MCP_ALL_SCOPES] },
    });
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
    seededAccountIds.push(
      (signUpResponse.body as { user: { id: string } }).user.id,
    );

    const signInResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/sign-in/email`)
      .send({ email, password })
      .expect(200);

    const setCookie = signInResponse.headers['set-cookie'] as unknown as
      string[] | undefined;
    const cookie = (setCookie ?? []).map((c) => c.split(';')[0]).join('; ');
    return { cookie };
  }

  async function registerClient(): Promise<string> {
    const registerResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/oauth2/register`)
      .send({
        client_name: `Integration Test Client ${randomUUID()}`,
        redirect_uris: ['http://localhost:9999/callback'],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
        // Only "native" clients get the http://localhost redirect-URI
        // exception (RFC 8252) — "web" clients require HTTPS, matching a
        // real ChatGPT/Claude cloud connector's redirect_uri in production.
        application_type: 'native',
      })
      .expect(201);
    return (registerResponse.body as { client_id: string }).client_id;
  }

  interface PkcePair {
    codeVerifier: string;
    codeChallenge: string;
  }

  function generatePkce(): PkcePair {
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  // Drives authorize -> consent and returns the issued authorization code.
  // The redirect from /oauth2/authorize carries a *signed* query string (not
  // a bare consent_code) that must be echoed back verbatim as `oauth_query`
  // in the /oauth2/consent request body — see @better-auth/oauth-provider's
  // consent "before" hook (matcher: ctx.body?.oauth_query).
  async function authorizeAndConsent(
    cookie: string,
    clientId: string,
    pkce: PkcePair,
    // Real clients (ChatGPT/Claude) also request offline_access so they get
    // a refresh token — see MCP_OFFLINE_ACCESS_SCOPE. Defaulted here so the
    // existing tool-call tests below don't need to change.
    scope = 'leads',
  ): Promise<string> {
    const authorizeResponse = await request(app.getHttpServer())
      .get(`${CUSTOMER_AUTH_BASE_PATH}/oauth2/authorize`)
      .set('Cookie', cookie)
      .query({
        client_id: clientId,
        redirect_uri: 'http://localhost:9999/callback',
        response_type: 'code',
        code_challenge: pkce.codeChallenge,
        code_challenge_method: 'S256',
        resource: mcpResource,
        scope,
      })
      .expect(302);

    const location = authorizeResponse.headers.location;
    const consentPath = new URL(location, appConfig.publicAppBaseUrl);
    const oauthQuery = consentPath.search.slice(1);

    const consentResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/oauth2/consent`)
      .set('Cookie', cookie)
      .set('Origin', trustedOrigin)
      .send({ accept: true, oauth_query: oauthQuery })
      .expect(200);

    const redirectUrl = new URL((consentResponse.body as { url: string }).url);
    const code = redirectUrl.searchParams.get('code');
    if (!code) {
      throw new Error(
        `No authorization code in consent redirect: ${redirectUrl.toString()}`,
      );
    }
    return code;
  }

  async function exchangeToken(
    clientId: string,
    code: string,
    pkce: PkcePair,
  ): Promise<string> {
    const tokenResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/oauth2/token`)
      .type('form')
      .send({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'http://localhost:9999/callback',
        client_id: clientId,
        code_verifier: pkce.codeVerifier,
        resource: mcpResource,
      })
      .expect(200);
    return (tokenResponse.body as { access_token: string }).access_token;
  }

  // Same exchange as exchangeToken, but returns the full token response — used
  // by the tests that need to see whether refresh_token / id_token were issued.
  async function exchangeTokenFull(
    clientId: string,
    code: string,
    pkce: PkcePair,
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    id_token?: string;
  }> {
    const tokenResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/oauth2/token`)
      .type('form')
      .send({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'http://localhost:9999/callback',
        client_id: clientId,
        code_verifier: pkce.codeVerifier,
        resource: mcpResource,
      })
      .expect(200);
    return tokenResponse.body as {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
    };
  }

  interface McpToolCallResult {
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
  }

  async function callTool(
    accessToken: string,
    name: string,
    args: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    const response = await request(app.getHttpServer())
      .post(MCP_BASE_PATH)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json, text/event-stream')
      .send({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name, arguments: args },
        id: randomUUID(),
      })
      .expect(200);

    // The transport replies with an SSE-framed body ("event: message\ndata:
    // {...}\n\n") even for a single JSON-RPC response — extract the JSON
    // payload from the "data:" line.
    const text = response.text;
    const dataLine = text.split('\n').find((line) => line.startsWith('data:'));
    if (!dataLine) {
      throw new Error(`No data line in MCP response: ${text}`);
    }
    const parsed = JSON.parse(dataLine.slice('data:'.length).trim()) as {
      result?: McpToolCallResult;
      error?: { message: string };
    };
    if (parsed.error) {
      throw new Error(`MCP tool call error: ${parsed.error.message}`);
    }
    // A thrown NotFoundException/etc. inside a tool handler isn't a
    // JSON-RPC-level error — the SDK catches it and reports it as a normal
    // (200) result with isError: true, per MCP protocol convention.
    if (parsed.result?.isError) {
      throw new Error(
        `MCP tool reported an error: ${parsed.result.content[0]?.text}`,
      );
    }
    return parsed.result!;
  }

  it('rejects an unauthenticated MCP request with 401', async () => {
    await request(app.getHttpServer())
      .post(MCP_BASE_PATH)
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 1 })
      .expect(401);
  });

  it('issues a refresh_token when the client requests the offline_access scope', async () => {
    // Regression test: MCP_LEADS_SCOPES alone (no offline_access) meant no
    // client ever received a refresh token, so every connection died with
    // the calling host (ChatGPT/Claude) reporting a "reconnect" failure once
    // the ~1hr access token expired. See MCP_OFFLINE_ACCESS_SCOPE.
    const { cookie } = await signUpAndSignIn();
    const clientId = await registerClient();
    const pkce = generatePkce();

    const code = await authorizeAndConsent(
      cookie,
      clientId,
      pkce,
      'leads offline_access',
    );
    const token = await exchangeTokenFull(clientId, code, pkce);

    expect(token.refresh_token).toEqual(expect.any(String));
  });

  it('issues an id_token when the client requests the openid scope', async () => {
    // openid is in the mcp() plugin's scopes purely so oauth-provider serves
    // /.well-known/openid-configuration (see MCP_OPENID_SCOPE); this confirms a
    // client can actually be granted it against the MCP resource — i.e. the
    // resource's allowedScopes include openid, not just the AS-level config.
    const { cookie } = await signUpAndSignIn();
    const clientId = await registerClient();
    const pkce = generatePkce();

    const code = await authorizeAndConsent(
      cookie,
      clientId,
      pkce,
      'openid leads offline_access',
    );
    const token = await exchangeTokenFull(clientId, code, pkce);

    expect(token.id_token).toEqual(expect.any(String));
  });

  it('registers a client, completes authorize+consent+PKCE+token, and calls a tool end-to-end', async () => {
    const { cookie } = await signUpAndSignIn();
    const clientId = await registerClient();
    const pkce = generatePkce();

    const code = await authorizeAndConsent(cookie, clientId, pkce);
    const accessToken = await exchangeToken(clientId, code, pkce);

    const createResult = await callTool(accessToken, 'create_lead', {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    const createdLead = JSON.parse(createResult.content[0].text) as {
      id: string;
      name: string;
    };
    expect(createdLead.name).toBe('Ada Lovelace');

    const listResult = await callTool(accessToken, 'list_leads', {});
    const listPayload = JSON.parse(listResult.content[0].text) as {
      leads: Array<{ id: string }>;
      total: number;
      hasMore: boolean;
    };
    expect(listPayload.leads.some((lead) => lead.id === createdLead.id)).toBe(
      true,
    );
    expect(listPayload.total).toBeGreaterThanOrEqual(1);
    expect(listPayload.hasMore).toBe(false);
  });

  it('a lead created by one customer is never visible to another over MCP', async () => {
    const customerA = await signUpAndSignIn();
    const customerB = await signUpAndSignIn();

    const clientIdA = await registerClient();
    const pkceA = generatePkce();
    const codeA = await authorizeAndConsent(customerA.cookie, clientIdA, pkceA);
    const tokenA = await exchangeToken(clientIdA, codeA, pkceA);

    const clientIdB = await registerClient();
    const pkceB = generatePkce();
    const codeB = await authorizeAndConsent(customerB.cookie, clientIdB, pkceB);
    const tokenB = await exchangeToken(clientIdB, codeB, pkceB);

    const createResult = await callTool(tokenA, 'create_lead', {
      name: 'Customer A Only Lead',
    });
    const lead = JSON.parse(createResult.content[0].text) as { id: string };

    const listResultB = await callTool(tokenB, 'list_leads', {});
    const listPayloadB = JSON.parse(listResultB.content[0].text) as {
      leads: Array<{ id: string }>;
    };
    expect(listPayloadB.leads.some((l) => l.id === lead.id)).toBe(false);

    await expect(
      callTool(tokenB, 'get_lead', { leadId: lead.id }),
    ).rejects.toThrow();
  });

  // These assert the raw mount surface registerAuthHttpMounts wires up — the
  // root-relative OAuth discovery documents an MCP client (Claude/ChatGPT)
  // fetches before it can register or authorize. The regression these guard
  // against: nginx + the backend mount list previously only covered
  // /.well-known/oauth-protected-resource, so Claude's RFC 8414 path-insertion
  // fetch of the authorization-server metadata got the SPA shell instead of
  // JSON and client registration failed ("Couldn't register with the sign-in
  // service").
  describe('OAuth discovery documents', () => {
    const asMetadataPath = `${OAUTH_AUTHORIZATION_SERVER_METADATA_PATH}${CUSTOMER_AUTH_BASE_PATH}`;
    const oidcMetadataPath = `${CUSTOMER_AUTH_BASE_PATH}${OPENID_CONFIGURATION_METADATA_PATH}`;
    const prmMetadataPath = `${OAUTH_PROTECTED_RESOURCE_METADATA_PATH}${MCP_BASE_PATH}`;

    it('serves RFC 8414 authorization-server metadata as JSON at the path-insertion URL', async () => {
      const res = await request(app.getHttpServer())
        .get(asMetadataPath)
        .expect(200);

      expect(res.type).toBe('application/json');
      const body = res.body as {
        issuer: string;
        registration_endpoint: string;
        code_challenge_methods_supported: string[];
        token_endpoint_auth_methods_supported: string[];
        scopes_supported: string[];
      };
      expect(body.issuer).toBe(
        `${appConfig.betterAuthUrl}${CUSTOMER_AUTH_BASE_PATH}`,
      );
      expect(body.registration_endpoint).toBe(
        `${appConfig.betterAuthUrl}${CUSTOMER_AUTH_BASE_PATH}/oauth2/register`,
      );
      expect(body.code_challenge_methods_supported).toEqual(['S256']);
      expect(body.token_endpoint_auth_methods_supported).toContain('none');
      expect(body.scopes_supported).toEqual(
        expect.arrayContaining(['leads', 'offline_access', 'openid']),
      );
    });

    it('serves OpenID Connect discovery metadata as JSON', async () => {
      const res = await request(app.getHttpServer())
        .get(oidcMetadataPath)
        .expect(200);

      expect(res.type).toBe('application/json');
      const body = res.body as {
        issuer: string;
        userinfo_endpoint: string;
        jwks_uri: string;
        code_challenge_methods_supported: string[];
      };
      expect(body.issuer).toBe(
        `${appConfig.betterAuthUrl}${CUSTOMER_AUTH_BASE_PATH}`,
      );
      expect(body.userinfo_endpoint).toBe(
        `${appConfig.betterAuthUrl}${CUSTOMER_AUTH_BASE_PATH}/oauth2/userinfo`,
      );
      expect(body.code_challenge_methods_supported).toEqual(['S256']);
    });

    it('still serves RFC 9728 protected-resource metadata (regression)', async () => {
      const res = await request(app.getHttpServer())
        .get(prmMetadataPath)
        .expect(200);

      expect(res.type).toBe('application/json');
      const body = res.body as {
        resource: string;
        authorization_servers: string[];
      };
      expect(body.resource).toBe(mcpResource);
      expect(body.authorization_servers).toContain(
        `${appConfig.betterAuthUrl}${CUSTOMER_AUTH_BASE_PATH}`,
      );
    });

    it('reflects a cross-origin preflight for the discovery documents', async () => {
      const res = await request(app.getHttpServer())
        .options(asMetadataPath)
        .set('Origin', 'https://claude.ai')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBeLessThan(300);
      expect(res.headers['access-control-allow-origin']).toBe(
        'https://claude.ai',
      );
    });

    it('rejects a non-GET to the authorization-server metadata with 405', async () => {
      await request(app.getHttpServer()).post(asMetadataPath).expect(405);
    });
  });
});
