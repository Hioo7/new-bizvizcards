export interface CustomerOrganisationMembership {
  organisationId: string;
  organisationName: string;
  organisationLogoUrl: string | null;
  role: "SPOC" | "MEMBER";
  spocEmail: string | null;
}

export interface OrganisationSummary {
  id: string;
  name: string;
  logoMediaId: string | null;
  logoUrl: string | null;
  createdByCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganisationListResponse {
  organisations: OrganisationSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListOrganisationsQuery {
  search?: string;
  page: number;
  pageSize: number;
}

export interface CreateOrganisationPayload {
  customerId: string;
  name: string;
}

export interface CreateOrganisationResponse {
  organisation: OrganisationSummary;
  membership: {
    id: string;
    customerId: string;
    organisationId: string;
    role: "SPOC" | "MEMBER";
    status: "ACTIVE" | "SUSPENDED";
    joinedAt: string;
  };
}

export interface UpdateOrganisationPayload {
  name: string;
}

export interface UpdateOrganisationLogoResponse {
  logoMediaId: string | null;
  logoUrl: string;
}

export interface AddOrganisationMemberPayload {
  customerIds: string[];
  role?: "SPOC" | "MEMBER";
}

export interface AddedOrganisationMember {
  id: string;
  organisationId: string;
  customerId: string;
  role: "SPOC" | "MEMBER";
  status: "ACTIVE" | "SUSPENDED";
  joinedAt: string;
}

export interface UpdateOrganisationMemberPayload {
  role?: "SPOC" | "MEMBER";
  status?: "ACTIVE" | "SUSPENDED";
}
