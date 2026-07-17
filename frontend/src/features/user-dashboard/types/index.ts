// Dashboard section types
export type DashboardSection = "profile" | "leads" | "analytics" | "cart" | "settings";

// ── Leads ────────────────────────────────────────────────────────────────────

export const LEAD_SOURCE_TYPES = [
  "SMART_CARD",
  "E_CARD",
  "CARD_SCANNER",
  "MANUAL_ENTRY",
] as const;

export type LeadSourceType = (typeof LEAD_SOURCE_TYPES)[number];

export const LEAD_SOURCE_LABELS: Record<LeadSourceType, string> = {
  SMART_CARD: "Smart Card",
  E_CARD: "E-Card",
  CARD_SCANNER: "Card Scanner",
  MANUAL_ENTRY: "Manual Entry",
};

export const OPPORTUNITY_STAGES = [
  "LEAD",
  "QUALIFIED_LEAD",
  "NEEDS_ANALYSIS",
  "PROPOSAL_DEMO",
  "NEGOTIATION",
  "CLOSED_WON",
  "ONBOARDING",
  "ACTIVE_RETENTION",
  "CHURNED_CLOSED_LOST",
] as const;

export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  LEAD: "Lead",
  QUALIFIED_LEAD: "Qualified Lead",
  NEEDS_ANALYSIS: "Needs Analysis",
  PROPOSAL_DEMO: "Proposal / Demo",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  ONBOARDING: "Onboarding",
  ACTIVE_RETENTION: "Active Retention",
  CHURNED_CLOSED_LOST: "Churned",
};

// Pill colour classes for each stage (bg + text, works with rounded-full px-3 py-1)
export const OPPORTUNITY_STAGE_COLORS: Record<OpportunityStage, string> = {
  LEAD: "bg-neutral/15 text-neutral",
  QUALIFIED_LEAD: "bg-info/15 text-info",
  NEEDS_ANALYSIS: "bg-primary/15 text-primary",
  PROPOSAL_DEMO: "bg-secondary/15 text-secondary",
  NEGOTIATION: "bg-warning/20 text-warning",
  CLOSED_WON: "bg-success/15 text-success",
  ONBOARDING: "bg-success/15 text-success",
  ACTIVE_RETENTION: "bg-success/15 text-success",
  CHURNED_CLOSED_LOST: "bg-error/15 text-error",
};

// Lead model (matches backend LeadModel)
export interface Lead {
  id: string;
  customerId: string;
  sourcedBy: LeadSourceType;
  name: string;
  email?: string | null;
  countryDialCode?: string | null;
  phoneNumber?: string | null;
  note?: string | null;
  company?: string | null;
  profession?: string | null;
  location?: string | null;
  stage?: OpportunityStage | null;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Lead folder
export interface LeadFolder {
  id: string;
  customerId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface DefaultLeadFolderResponse {
  defaultLeadFolderId: string | null;
}

export interface CreateLeadPayload {
  name: string;
  email?: string;
  countryDialCode?: string;
  phoneNumber?: string;
  note?: string;
  company?: string;
  profession?: string;
  location?: string;
  stage?: OpportunityStage;
  folderId?: string;
}

export interface UpdateLeadPayload {
  name?: string;
  email?: string | null;
  countryDialCode?: string | null;
  phoneNumber?: string | null;
  note?: string | null;
  company?: string | null;
  profession?: string | null;
  location?: string | null;
  stage?: OpportunityStage | null;
  folderId?: string | null;
}

export interface CreateLeadFolderPayload {
  name: string;
}

// ── Profile ──────────────────────────────────────────────────────────────────

export interface UserSocials {
  whatsapp: string;
  twitter: string;
  instagram: string;
  linkedin: string;
}

export interface ExtendedUserProfile {
  phone: string;
  countryCode: string;
  profession: string;
  about: string;
  description: string;
  socials: UserSocials;
}

// ── Organisation ─────────────────────────────────────────────────────────────

export interface Organisation {
  id: string;
  name: string;
  createdByCustomerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganisationMembership {
  id: string;
  organisationId: string;
  customerId: string;
  role: "SPOC" | "MEMBER";
  status: "ACTIVE" | "SUSPENDED";
  joinedAt: string;
}

export interface OrganisationWithMembership {
  organisation: Organisation;
  membership: OrganisationMembership;
}

export interface CreateOrganisationPayload {
  name: string;
}

export interface OrgMemberLinkedEcard {
  id: string;
  endpoint: string;
  heroName: string;
  isExchangeContactEnabled: boolean;
}

export interface OrgMemberListItem {
  id: string;
  customerId: string;
  name: string;
  email: string;
  role: "SPOC" | "MEMBER";
  status: "ACTIVE" | "SUSPENDED";
  joinedAt: string;
  profilePicture?: string | null;
  linkedEcard: OrgMemberLinkedEcard | null;
}

// ── Org Ecards ────────────────────────────────────────────────────────────────

export interface OrgEcardHero {
  name: string;
  email: string;
  companyName: string | null;
  profilePhotoUrl: string | null;
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
  isExchangeContactEnabled: boolean;
  autoDownloadContact: boolean;
}

export interface OrgEcardAboutComponent {
  id: string;
  order: number;
  type: "ABOUT";
  profession: string | null;
  shortNote: string | null;
  description: string | null;
  aboutMe: string | null;
}

export interface OrgEcardWhatsAppComponent {
  id: string;
  order: number;
  type: "WHATSAPP";
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
}

export type OrgEcardComponent =
  | OrgEcardAboutComponent
  | OrgEcardWhatsAppComponent
  | { id: string; order: number; type: "SOCIAL_LINKS" | "GALLERY" | "VIDEO" | "TEAM" | "BROCHURE"; [key: string]: unknown };

export interface OrgEcard {
  id: string;
  endpoint: string;
  customerId: string;
  organisationId: string | null;
  hero: OrgEcardHero;
  components: OrgEcardComponent[];
}

export interface OrgEcardListResponse {
  ecards: OrgEcard[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UpdateOrgEcardPayload {
  endpoint: string;
  heroName: string;
  heroEmail: string;
  heroCompanyName?: string;
  isExchangeContactEnabled: boolean;
  autoDownloadContact: boolean;
  components: Array<
    | { type: "ABOUT"; profession?: string; shortNote?: string; description?: string; aboutMe?: string }
    | { type: "WHATSAPP"; phoneCountryDialCode: string; phoneNumber: string }
    | { type: string; [key: string]: unknown }
  >;
}

export interface OrgInvite {
  id: string;
  organisationId: string;
  email: string;
  role: "SPOC" | "MEMBER";
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
}

export interface InviteMemberPayload {
  email: string;
  role?: "SPOC" | "MEMBER";
}

export interface UpdateMemberPayload {
  role?: "SPOC" | "MEMBER";
  status?: "ACTIVE" | "SUSPENDED";
}

// ── Lead Reference Notes ──────────────────────────────────────────────────────

export interface LeadReferenceNote {
  id: string;
  leadId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadReferenceNotePayload {
  content: string;
}

export interface UpdateLeadReferenceNotePayload {
  content: string;
}

// ── Lead Reminders ────────────────────────────────────────────────────────────

export const REMINDER_STATUSES = ["PENDING", "TRIGGERED", "DISMISSED"] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export interface LeadReminder {
  id: string;
  leadId: string;
  title: string;
  text?: string | null;
  triggerAt: string;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadReminderPayload {
  title: string;
  text?: string;
  triggerAt: string; // ISO date string
}

export interface UpdateLeadReminderPayload {
  title?: string;
  text?: string | null;
  triggerAt?: string;
  status?: ReminderStatus;
}
