import { useEffect, useState } from "react";
import { RESEND_COOLDOWN_SECONDS } from "@features/admin/config";

export function useResendCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const restart = () => setSecondsLeft(RESEND_COOLDOWN_SECONDS);

  return { secondsLeft, restart };
}
