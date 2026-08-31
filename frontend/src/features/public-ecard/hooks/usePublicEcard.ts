import { useEffect, useState } from "react";
import { getPublicEcard } from "@services/publicEcardService";
import type { EcardTrafficAttribution } from "@config/ecardTraffic";
import type { Ecard } from "@app-types/ecard";
import type { PublicExchangeContactForm } from "@app-types/exchangeContactForm";
import { readEcardTrafficParams } from "@features/public-ecard/utils/readEcardTrafficParams";

export interface UsePublicEcardResult {
  card: Ecard | null;
  viewEventId: string | null;
  exchangeContactAllowed: boolean;
  exchangeContactForm: PublicExchangeContactForm | null;
  /** `?src=&sref=` attribution from the landing URL, forwarded to every
   *  exchange-contact submission. Empty object when the URL carried none. */
  trafficAttribution: EcardTrafficAttribution;
  isLoading: boolean;
  error: string | null;
}

export function usePublicEcard(endpoint: string | undefined): UsePublicEcardResult {
  const [card, setCard] = useState<Ecard | null>(null);
  const [viewEventId, setViewEventId] = useState<string | null>(null);
  const [exchangeContactAllowed, setExchangeContactAllowed] = useState(false);
  const [exchangeContactForm, setExchangeContactForm] =
    useState<PublicExchangeContactForm | null>(null);
  // Read once from the URL the visitor landed on — later client-side
  // navigation never changes a public e-card's attribution.
  const [trafficAttribution] = useState<EcardTrafficAttribution>(() =>
    readEcardTrafficParams(window.location.search),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!endpoint) return;
    let cancelled = false;

    async function fetchCard() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getPublicEcard(
          endpoint as string,
          trafficAttribution,
        );
        if (!cancelled) {
          setCard(result.card);
          setViewEventId(result.viewEventId);
          setExchangeContactAllowed(result.exchangeContactAllowed);
          setExchangeContactForm(result.exchangeContactForm);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "E-card not found.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchCard();
    return () => {
      cancelled = true;
    };
  }, [endpoint, trafficAttribution]);

  return {
    card,
    viewEventId,
    exchangeContactAllowed,
    exchangeContactForm,
    trafficAttribution,
    isLoading,
    error,
  };
}
