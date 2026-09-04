import cors from 'cors';
import type { Express } from 'express';
import rateLimit from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import {
  OAUTH_MCP_RATE_LIMIT_MAX_REQUESTS,
  OAUTH_MCP_RATE_LIMIT_WINDOW_MS,
} from '../config/rate-limit.constants';
import {
  CUSTOMER_AUTH_BASE_PATH,
  EMPLOYEE_AUTH_BASE_PATH,
  MCP_BASE_PATH,
  OAUTH_AUTHORIZATION_SERVER_METADATA_PATH,
  OAUTH_PROTECTED_RESOURCE_METADATA_PATH,
  OPENID_CONFIGURATION_METADATA_PATH,
} from './auth.constants';
import type { CustomerAuth } from './customer-auth.factory';
import type { EmployeeAuth } from './employee-auth.factory';

// The OAuth 2.1 base path under the customer-auth instance — every oauth-provider
// endpoint (oauth2/authorize, oauth2/token, oauth2/register, oauth2/introspect,
// oauth2/revoke, oauth2/userinfo) lives beneath it, so the cross-origin CORS and
// the rate limiter are both scoped here as one prefix.
const CUSTOMER_OAUTH2_BASE_PATH = `${CUSTOMER_AUTH_BASE_PATH}/oauth2`;

// Express `all()` wildcard suffix — better-auth's toNodeHandler owns every method
// and sub-path under the base path it's mounted on.
const SPLAT = '/*splat';

// The OAuth discovery documents that better-auth's oauth-provider serves from a
// root-relative onRequest hook (i.e. NOT under CUSTOMER_AUTH_BASE_PATH). Each has
// to be mounted to the customer-auth handler as its own route, and proxied by
// nginx, or the request falls through to the SPA shell — see the comments on
// these constants in auth.constants.ts and the nginx `location` blocks. Both the
// bare path and every `/*splat` sub-path are mounted, because the RFC 8414
// path-insertion form carries the issuer path as a suffix
// (`/.well-known/oauth-authorization-server/api/auth/customers`).
const ROOT_RELATIVE_DISCOVERY_PATHS = [
  OAUTH_PROTECTED_RESOURCE_METADATA_PATH,
  OAUTH_AUTHORIZATION_SERVER_METADATA_PATH,
  OPENID_CONFIGURATION_METADATA_PATH,
] as const;

export interface AuthHttpMountDeps {
  customerAuth: CustomerAuth;
  // Optional so tests that only exercise the customer/MCP surface can skip
  // wiring the staff auth instance.
  employeeAuth?: EmployeeAuth;
}

/**
 * Registers every raw Express mount for the better-auth instances and the public
 * OAuth/MCP discovery surface, in the one order that works:
 *
 *   1. cross-origin CORS + rate limiting (`use`, must precede the handlers),
 *   2. the better-auth `all()` handlers for each base path,
 *   3. the root-relative OAuth discovery document routes.
 *
 * The MCP transport endpoint (`POST /api/mcp`) is deliberately NOT mounted here:
 * production reads the raw request stream (so it must be mounted before
 * `express.json()`), while the integration test parses the body first and adapts
 * the handler differently — each caller mounts it itself, after calling this.
 *
 * `main.ts` and `test/integration/mcp-oauth-leads.e2e-spec.ts` both call this so
 * the endpoint list can't drift between them (it has twice before — the CORS fix
 * and the nginx fix each only covered part of it).
 */
export function registerAuthHttpMounts(
  httpAdapter: Express,
  deps: AuthHttpMountDeps,
): void {
  // This OAuth/MCP surface is meant to be called cross-origin by arbitrary
  // third-party MCP clients (ChatGPT, Claude, future connectors) — it's guarded
  // by bearer tokens / PKCE, not same-origin trust. `origin: true` reflects the
  // caller's Origin (no fixed allowlist to maintain); `credentials: false` since
  // nothing here relies on cookies cross-origin (oauth2/authorize is a top-level
  // browser navigation, not a script fetch). This runs ahead of the app-wide
  // `app.enableCors()`, which is registered last and only allows this app's own
  // frontend origins.
  const publicOAuthMcpCors = cors({ origin: true, credentials: false });
  httpAdapter.use(CUSTOMER_OAUTH2_BASE_PATH, publicOAuthMcpCors);
  for (const path of ROOT_RELATIVE_DISCOVERY_PATHS) {
    httpAdapter.use(path, publicOAuthMcpCors);
  }
  httpAdapter.use(MCP_BASE_PATH, publicOAuthMcpCors);

  // Rate-limited here rather than via a Nest ThrottlerGuard: these are raw
  // Express mounts that never enter Nest's routing/guard pipeline. Keyed on the
  // real client IP (main.ts sets `trust proxy` for the single nginx hop).
  const oauthMcpRateLimiter = rateLimit({
    windowMs: OAUTH_MCP_RATE_LIMIT_WINDOW_MS,
    limit: OAUTH_MCP_RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
  });
  httpAdapter.use(CUSTOMER_OAUTH2_BASE_PATH, oauthMcpRateLimiter);
  httpAdapter.use(MCP_BASE_PATH, oauthMcpRateLimiter);

  if (deps.employeeAuth) {
    httpAdapter.all(
      `${EMPLOYEE_AUTH_BASE_PATH}${SPLAT}`,
      toNodeHandler(deps.employeeAuth),
    );
  }
  httpAdapter.all(
    `${CUSTOMER_AUTH_BASE_PATH}${SPLAT}`,
    toNodeHandler(deps.customerAuth),
  );

  // The discovery documents are served by an onRequest hook that checks the raw
  // request path directly — it never sees CUSTOMER_AUTH_BASE_PATH-relative
  // routing, so it needs its own mount to the same handler, at both the bare
  // path and every resource/issuer-scoped sub-path an MCP client may try.
  // `all()` (not `get()`) so the handler can also answer non-GET with the RFC's
  // own `405 Allow: GET, HEAD` rather than falling through to a bare 404.
  for (const path of ROOT_RELATIVE_DISCOVERY_PATHS) {
    httpAdapter.all(path, toNodeHandler(deps.customerAuth));
    httpAdapter.all(`${path}${SPLAT}`, toNodeHandler(deps.customerAuth));
  }
}
