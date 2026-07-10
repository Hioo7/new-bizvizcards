import { useEffect, useRef } from "react";

export const EXCHANGE_CONTACT_AUTO_OPEN_DELAY_MS = 5000;

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
