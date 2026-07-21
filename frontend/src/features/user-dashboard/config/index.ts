export const DASHBOARD_API = {
  leads: "/api/leads",
  lead: (id: string) => `/api/leads/${id}`,
  leadFolders: "/api/lead-folders",
  leadFolder: (id: string) => `/api/lead-folders/${id}`,
  leadFolderDefault: "/api/lead-folders/default",
  organisation: "/api/organisations/me",
  organisations: "/api/organisations",
  orgMembers: (organisationId: string) => `/api/organisations/members/${organisationId}`,
  orgMember: (id: string) => `/api/organisations/members/${id}`,
  orgInvites: (organisationId: string) => `/api/organisations/invites/${organisationId}`,
  orgInvite: (id: string) => `/api/organisations/invites/${id}`,
  acceptOrgInvite: (token: string) => `/api/organisation-invites/${token}/accept`,
  leadReferenceNotes: (leadId: string) => `/api/leads/${leadId}/reference-notes`,
  leadReferenceNote: (leadId: string, noteId: string) =>
    `/api/leads/${leadId}/reference-notes/${noteId}`,
  leadReminders: (leadId: string) => `/api/leads/${leadId}/reminders`,
  leadReminder: (leadId: string, reminderId: string) =>
    `/api/leads/${leadId}/reminders/${reminderId}`,
  orgEcards: (organisationId: string) =>
    `/api/organisations/${organisationId}/ecards`,
  orgEcard: (organisationId: string, ecardId: string) =>
    `/api/organisations/${organisationId}/ecards/${ecardId}`,
};

export const PROFILE_CARD_ORDER_STORAGE_KEY = (userId: string) =>
  `bizviz_card_order_${userId}`;

export const PROFILE_CARD_IDS = ["org", "contact", "bio", "socials"] as const;

export const PROFILE_CARD_LABELS: Record<
  (typeof PROFILE_CARD_IDS)[number],
  string
> = {
  org: "Organisation",
  contact: "Contact Info",
  bio: "Professional Bio",
  socials: "Social Links",
};

export const LEADS_QUERY_DEFAULT_PAGE_SIZE = 50;
export const INSIGHTS_MONTHS_COUNT = 6;
export const INSIGHTS_DAYS_COUNT = 7;
export const RECENT_LEADS_MAX = 5;
export const LEADS_FOLDERS_PREVIEW_MAX = 3;
export const DASHBOARD_APP_VERSION = "v1.0.0";

export const SHOP_PAGE_SIZE = 20;
export const CART_ITEM_MAX_QUANTITY = 99;
