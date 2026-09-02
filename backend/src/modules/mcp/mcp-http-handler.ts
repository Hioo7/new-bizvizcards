import { requireMcpAuth } from '@better-auth/mcp';
import type { JWTPayload } from 'jose';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import type { CustomerAuth } from '../../common/auth/customer-auth.factory';
import { CustomersService } from '../customers/services/customers.service';
import { McpServerService } from './services/mcp-server.service';

// requireMcpAuth verifies the bearer token (signature/issuer/audience/expiry
// against the jwt() plugin's JWKS) and hands us the verified claims — `sub`
// is the CustomerAccount id (better-auth's user id for the customer-auth
// instance), same value CustomerAuthGuard reads off a browser session.
export function createMcpFetchHandler(deps: {
  customerAuth: CustomerAuth;
  mcpServerService: McpServerService;
  customersService: CustomersService;
  resource: string;
  // Overrides where requireMcpAuth fetches the JWKS from. Left unset in
  // production (defaults to customerAuth's own configured baseURL + /jwks).
  // Tests that bind the app to a dynamic/ephemeral port (rather than the
  // fixed BETTER_AUTH_URL port) need this so the JWKS fetch is actually
  // reachable — `issuer` is deliberately NOT overridable the same way,
  // since it must keep matching the `iss` claim baked into tokens at
  // signing time (derived from customerAuth's real configured baseURL,
  // independent of whatever port the app happens to listen on).
  jwksUrl?: string;
}): (request: Request) => Promise<Response> {
  return requireMcpAuth(
    deps.customerAuth,
    async (request: Request, accessTokenClaims: JWTPayload) => {
      const customer = await deps.customersService.getByAccountId(
        accessTokenClaims.sub!,
      );
      const server = deps.mcpServerService.createServer(customer.id);
      // Stateless mode (sessionIdGenerator: undefined) — a fresh
      // server+transport pair per request, scoped to the resolved customer,
      // so tool closures never leak across customers or requests.
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      return transport.handleRequest(request);
    },
    { resource: deps.resource, jwksUrl: deps.jwksUrl },
  );
}
