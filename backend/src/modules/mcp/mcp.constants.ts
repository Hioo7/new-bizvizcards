export const MCP_SERVER_NAME = 'bizvizcards-leads';
export const MCP_SERVER_VERSION = '1.0.0';

// list_leads page size: kept small enough that a full page of trimmed lead
// summaries stays comfortably inside a single MCP tool-call response. A
// customer's full lead list returned unbounded in one call was silently
// truncated by the calling host past some size, with no signal to the agent
// that it was incomplete — see leads.tools.ts's listLeadsHandler.
export const MCP_LEADS_LIST_DEFAULT_LIMIT = 50;
export const MCP_LEADS_LIST_MAX_LIMIT = 100;
