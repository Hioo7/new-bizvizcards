export const DASHBOARD_API = {
  leads: "/api/leads",
  lead: (id: string) => `/api/leads/${id}`,
  leadFolders: "/api/lead-folders",
  leadFolder: (id: string) => `/api/lead-folders/${id}`,
  leadFolderDefault: "/api/lead-folders/default",
} as const;

export const LEADS_QUERY_DEFAULT_PAGE_SIZE = 50;
export const INSIGHTS_MONTHS_COUNT = 6;
export const INSIGHTS_DAYS_COUNT = 7;
export const RECENT_LEADS_MAX = 5;
export const DASHBOARD_APP_VERSION = "v1.0.0";
