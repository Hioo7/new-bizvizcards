export const EMPLOYEE_AUTH = Symbol('EMPLOYEE_AUTH');
export const CUSTOMER_AUTH = Symbol('CUSTOMER_AUTH');

export const EMPLOYEE_AUTH_BASE_PATH = '/api/auth/staff';
export const CUSTOMER_AUTH_BASE_PATH = '/api/auth/customers';

// Canonical MCP server endpoint — also used as the OAuth `resource` (RFC 8707
// audience) identifier for the customer-auth mcp() plugin. See
// customer-auth.factory.ts and modules/mcp/mcp-http-handler.ts.
export const MCP_BASE_PATH = '/api/mcp';

// RFC 9728 Protected Resource Metadata path the mcp() plugin serves via a
// root-relative onRequest hook (checked against the raw request path,
// independent of CUSTOMER_AUTH_BASE_PATH) — so it must be mounted to the
// customer-auth handler as its own route in main.ts, alongside the
// CUSTOMER_AUTH_BASE_PATH wildcard mount, or a request to it never reaches
// the auth instance at all.
export const OAUTH_PROTECTED_RESOURCE_METADATA_PATH =
  '/.well-known/oauth-protected-resource';

// RFC 8414 Authorization Server Metadata / OpenID Connect Discovery paths.
// @better-auth/oauth-provider serves both via a root-relative onRequest hook
// that matches the raw request path against
// `/.well-known/oauth-authorization-server<issuerPath>` and
// `<issuerPath>/.well-known/openid-configuration` (issuerPath =
// CUSTOMER_AUTH_BASE_PATH, since better-auth appends basePath to baseURL to
// form the issuer) — same situation as OAUTH_PROTECTED_RESOURCE_METADATA_PATH:
// the request never carries CUSTOMER_AUTH_BASE_PATH-relative routing, so each
// must be mounted to the customer-auth handler as its own root route in
// register-auth-http-mounts.ts AND proxied to the backend by nginx, or the
// request falls through to the SPA shell (HTTP 200 text/html) instead.
// Claude.ai's web connector fetches the RFC 8414 path-insertion URL
// (`/.well-known/oauth-authorization-server/api/auth/customers`) during OAuth
// discovery; without it, Dynamic Client Registration never starts and the
// connector fails with "Couldn't register with the sign-in service".
export const OAUTH_AUTHORIZATION_SERVER_METADATA_PATH =
  '/.well-known/oauth-authorization-server';
export const OPENID_CONFIGURATION_METADATA_PATH =
  '/.well-known/openid-configuration';

// Single bundled scope granted to every MCP/OAuth connection (ChatGPT/Claude)
// — per the brainstormed design, the consent screen shows one combined grant
// ("view and manage your leads, notes, and reminders") rather than granular
// toggles, matching how MCP clients request access today.
export const MCP_LEADS_SCOPES = ['leads'] as const;

// better-auth's oauth-provider only issues a refresh token for a grant whose
// scope includes "offline_access" (its DEFAULT_OAUTH_SCOPES already includes
// it, but that default is entirely replaced — not merged — once a plugin
// config supplies its own `scopes` array, as ours does via MCP_LEADS_SCOPES
// above). Without this, every MCP/OAuth connection is access-token-only:
// once the ~1hr access token expires, the client (ChatGPT/Claude) has
// nothing to silently refresh with, and the connection goes dead — surfaced
// to the user as "Your connection stopped working. Reconnect to continue."
// Must be included in both the mcp() plugin's `scopes` and the MCP
// resource's own `allowedScopes` in customer-auth.factory.ts, or a client
// requesting it is still refused.
export const MCP_OFFLINE_ACCESS_SCOPE = 'offline_access';

// Included in the mcp() plugin's `scopes` purely so @better-auth/oauth-provider
// serves the OpenID Connect discovery document at
// `/.well-known/openid-configuration` — both its onRequest hook and its
// `getOpenIdConfig` handler are gated on `opts.scopes.includes('openid')` and
// otherwise 404. Claude tries RFC 8414 (oauth-authorization-server) metadata
// first and only falls back to openid-configuration, so this is discovery
// hardening rather than strictly required. Like MCP_OFFLINE_ACCESS_SCOPE, it
// must appear in BOTH the mcp() `scopes` array and the MCP resource's own
// `allowedScopes` (see customer-auth.factory.ts), and existing OauthResource
// rows are re-synced on startup by backfillOauthResourceAllowedScopes in
// prisma/scripts/seed-plan-policy-defaults.ts.
export const MCP_OPENID_SCOPE = 'openid';

// The full scope set the customer-auth mcp() plugin advertises and allows for
// its MCP resource. Used as the single source of truth in three places that
// must agree or a client requesting a scope is refused: the mcp() plugin's
// `scopes`, the MCP resource's `allowedScopes` (both in customer-auth.factory.ts),
// and backfillOauthResourceAllowedScopes in
// prisma/scripts/seed-plan-policy-defaults.ts, which re-syncs the persisted
// OauthResource row (seeded once by mcp() and never updated on later deploys).
export const MCP_ALL_SCOPES = [
  ...MCP_LEADS_SCOPES,
  MCP_OFFLINE_ACCESS_SCOPE,
  MCP_OPENID_SCOPE,
] as const;

export const EMPLOYEE_AUTH_COOKIE_PREFIX = 'staff';
export const CUSTOMER_AUTH_COOKIE_PREFIX = 'customer';

// Retry policy for linking a newly created auth account row (CustomerAccount/
// EmployeeAccount) to its business-model row (Customer/Employee) in the
// databaseHooks.user.create.after hook. See link-account-with-retry.ts.
export const ACCOUNT_LINK_MAX_ATTEMPTS = 3;
export const ACCOUNT_LINK_RETRY_DELAY_MS = 200;

// Used by the databaseHooks.session.create.before ban check in
// customer-auth.factory.ts. Customer auth has no admin plugin (unlike
// employee auth), so ban enforcement is hand-rolled here rather than reusing
// the plugin's own messaging.
export const CUSTOMER_BANNED_MESSAGE =
  'This account has been suspended. Please contact support if you believe this is an error.';

// better-auth's own local-auth code (sign-up/sign-in/update-user) uses this
// literal providerId for every email+password credential row it creates —
// reused here (customers.service.ts) when hand-writing a CustomerCredential
// row outside of better-auth's own account-linking flow.
export const CREDENTIAL_PROVIDER_ID = 'credential';

// better-auth 1.7's account-identity change (see the 1.7 upgrade guide) added
// a required `issuer` column to CustomerCredential/EmployeeCredential,
// scoping account identity by issuer rather than provider config alone.
// These are the exact values better-auth's own local-auth code uses for each
// account type — reused here whenever this app hand-writes a credential row
// outside of better-auth's own account-linking flow, so hand-written and
// better-auth-written rows stay indistinguishable.
export const CREDENTIAL_ISSUER = 'local:credential';
export const GOOGLE_ISSUER = 'https://accounts.google.com';

// The providerId better-auth's Google social provider uses for the
// CustomerCredential row it creates on a Google sign-in — matches the
// `providers.google` key in social-providers.builder.ts. Reused by the
// legacy-data migration (google-oauth-credential.migrator.ts) to pre-link a
// migrated customer's existing legacy CardUser.googleId.
export const GOOGLE_PROVIDER_ID = 'google';

// "Sign in with Apple" POSTs its callback (response_mode=form_post), so
// Apple's own origin must be explicitly trusted for that request to pass
// better-auth's CSRF/origin check — see customer-auth.factory.ts.
export const APPLE_SIGN_IN_TRUSTED_ORIGIN = 'https://appleid.apple.com';

// Apple has no static OAuth client secret — better-auth instead signs one as
// a JWT at request time from the team/key id + private key. These are that
// JWT's fixed protocol parameters (Apple requires ES256; the audience is
// always Apple's own issuer). TTL is Apple's documented maximum lifetime for
// this token (6 months), matching better-auth's own documented example.
// See apple-client-secret.ts.
export const APPLE_CLIENT_SECRET_ALGORITHM = 'ES256';
export const APPLE_CLIENT_SECRET_AUDIENCE = 'https://appleid.apple.com';
export const APPLE_CLIENT_SECRET_TTL_SECONDS = 180 * 24 * 60 * 60;

// bcrypt (not better-auth's default scrypt) is used for customer passwords
// specifically so the legacy-data migration can carry over legacy CardUser
// bcrypt hashes directly, with zero forced password resets — see
// customer-password-hasher.ts and the migration plan for why. 10 rounds
// matches the legacy app's own bcryptjs usage exactly (migrationJobService.ts),
// so migrated and newly-hashed passwords are indistinguishable.
export const CUSTOMER_PASSWORD_BCRYPT_ROUNDS = 10;
