// Dashboard section types
export type DashboardSection = "profile" | "leads" | "analytics" | "cart" | "settings";

// Lead model (matches backend LeadModel)
export interface Lead {
  id: string;
  customerId: string;
  name: string;
  email?: string | null;
  countryDialCode?: string | null;
  phoneNumber?: string | null;
  note?: string | null;
  company?: string | null;
  profession?: string | null;
  location?: string | null;
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
  folderId?: string;
}

export interface UpdateLeadPayload {
  name?: string;
  email?: string;
  countryDialCode?: string;
  phoneNumber?: string;
  note?: string;
  company?: string;
  profession?: string;
  location?: string;
  folderId?: string | null;
}

export interface CreateLeadFolderPayload {
  name: string;
}

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
