import { useState } from "react";
import type { Ecard } from "@app-types/ecard";
import {
  listCustomerEcards,
  deleteCustomerEcard,
} from "@services/customerEcardService";

export interface UseCustomerEcardsResult {
  ecards: Ecard[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useCustomerEcards(): UseCustomerEcardsResult {
  const [ecards, setEcards] = useState<Ecard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await listCustomerEcards();
      setEcards(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load e-cards");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    await deleteCustomerEcard(id);
    setEcards((prev) => prev.filter((c) => c.id !== id));
  }

  return { ecards, loading, error, load, remove };
}
