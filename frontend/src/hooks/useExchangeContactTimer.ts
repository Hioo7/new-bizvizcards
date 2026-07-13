import { useEffect, useRef } from "react";
import { EXCHANGE_CONTACT_AUTO_OPEN_DELAY_MS } from "@config/exchangeContact.config";

export function useExchangeContactTimer(onTrigger: () => void): void {
  const onTriggerRef = useRef(onTrigger);

  useEffect(() => {
    onTriggerRef.current = onTrigger;
  });

  useEffect(() => {
    const timeout = window.setTimeout(
      () => onTriggerRef.current(),
      EXCHANGE_CONTACT_AUTO_OPEN_DELAY_MS,
    );
    return () => window.clearTimeout(timeout);
  }, []);
}
