export interface CustomerOrganisationMembership {
  organisationId: string;
  organisationName: string;
  organisationLogoUrl: string | null;
  role: "SPOC" | "MEMBER";
  spocEmail: string | null;
}
