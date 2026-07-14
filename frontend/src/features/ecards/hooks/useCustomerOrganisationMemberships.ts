import { useEffect, useState } from "react";
import { listCustomerOrganisationMemberships } from "@services/organisationService";
import type { CustomerOrganisationMembership } from "@app-types/organisation";

export interface UseCustomerOrganisationMembershipsResult {
  memberships: CustomerOrganisationMembership[];
  isLoading: boolean;
  error: string | null;
}

export function useCustomerOrganisationMemberships(
  customerId: string,
): UseCustomerOrganisationMembershipsResult {
  const [memberships, setMemberships] = useState<
    CustomerOrganisationMembership[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listCustomerOrganisationMemberships(customerId);
        if (cancelled) return;
        setMemberships(response);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load organisations.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return { memberships, isLoading, error };
}
