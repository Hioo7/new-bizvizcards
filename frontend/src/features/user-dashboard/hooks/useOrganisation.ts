import { useState, useCallback } from "react";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import type { Organisation, OrganisationWithMembership } from "@features/user-dashboard/types";

interface UseOrganisationReturn {
  data: OrganisationWithMembership | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  create: (name: string) => Promise<void>;
  update: (name: string) => Promise<void>;
}

export function useOrganisation(): UseOrganisationReturn {
  const [data, setData] = useState<OrganisationWithMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userDashboardService.getOrganisation();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load organisation",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (name: string) => {
    const result = await userDashboardService.createOrganisation({ name });
    setData(result);
  }, []);

  const update = useCallback(async (name: string) => {
    const organisation: Organisation =
      await userDashboardService.updateOrganisation(name);
    setData((prev) => (prev ? { ...prev, organisation } : null));
  }, []);

  return { data, loading, error, load, create, update };
}
