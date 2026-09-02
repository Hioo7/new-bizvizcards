// Applied to the OAuth authorization-server + MCP endpoints only (main.ts) —
// these are mounted directly on the raw Express adapter (bypassing Nest's
// own routing/guard pipeline), so a Nest-level throttler guard can't reach
// them; plain Express rate-limiting middleware is used instead.
export const OAUTH_MCP_RATE_LIMIT_WINDOW_MS = 60_000;
export const OAUTH_MCP_RATE_LIMIT_MAX_REQUESTS = 100;
