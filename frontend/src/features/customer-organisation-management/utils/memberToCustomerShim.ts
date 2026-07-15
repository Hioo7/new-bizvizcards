import type { OrganisationMemberSummary } from "@app-types/ecard";
import type { Customer } from "@app-types/customer";

/** Roster items have no pfpUrl/ban fields — this adapts one into a Customer
 * shape so the e-card quick-nav's `state: { customer }` payload still shows
 * a name/email header on the destination page. */
export function memberToCustomerShim(
  member: OrganisationMemberSummary,
): Customer {
  return {
    id: member.customerId,
    name: member.name,
    email: member.email,
    pfpUrl: null,
    banned: null,
    banReason: null,
    banExpires: null,
  };
}
