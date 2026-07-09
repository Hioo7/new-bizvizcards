import { useCallback, useEffect, useState } from "react";
import { listSmartCards } from "@services/smartCardService";
import type { SmartCard, SmartCardTemplateKey } from "@app-types/smartCard";
import { SMART_CARD_LIST_PAGE_SIZE } from "@features/smart-cards/config/smartCardForm.config";

export interface UseSmartCardListResult {
  smartCards: SmartCard[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  setPage: (value: number) => void;
  refetch: () => void;
}

export function useSmartCardList(
  templateKey: SmartCardTemplateKey,
): UseSmartCardListResult {
  const [page, setPage] = useState(1);
  const [smartCards, setSmartCards] = useState<SmartCard[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchSmartCards() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listSmartCards(templateKey, {
          page,
          pageSize: SMART_CARD_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        setSmartCards(response.smartCards);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load smart cards.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchSmartCards();

    return () => {
      cancelled = true;
    };
  }, [templateKey, page, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return {
    smartCards,
    total,
    page,
    pageSize: SMART_CARD_LIST_PAGE_SIZE,
    isLoading,
    error,
    setPage,
    refetch,
  };
}
