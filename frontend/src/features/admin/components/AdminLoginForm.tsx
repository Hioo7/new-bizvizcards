import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AdminPortalBadge from "@features/admin/components/AdminPortalBadge";
import EmailStep from "@features/admin/components/EmailStep";
import OtpStep from "@features/admin/components/OtpStep";
import { useResendCooldown } from "@features/admin/hooks/useResendCooldown";
import { sendSignInOtp, verifySignInOtp } from "@services/staffAuthService";
import { ROUTES } from "@config/routes";
import {
  GENERIC_SEND_OTP_ERROR_MESSAGE,
  GENERIC_VERIFY_OTP_ERROR_MESSAGE,
  INCOMPLETE_OTP_MESSAGE,
  OTP_LENGTH,
} from "@features/admin/config";

type Step = "email" | "otp";

export default function AdminLoginForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { secondsLeft, restart } = useResendCooldown();

  const requestOtp = async (targetEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await sendSignInOtp(targetEmail);
      setEmail(targetEmail);
      setStep("otp");
      restart();
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_SEND_OTP_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (code: string) => {
    if (code.length < OTP_LENGTH) {
      setError(INCOMPLETE_OTP_MESSAGE);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifySignInOtp({ email, otp: code });
      navigate(ROUTES.adminHome);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : GENERIC_VERIFY_OTP_ERROR_MESSAGE,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminPortalBadge />

      <AnimatePresence mode="wait">
        {step === "email" ? (
          <EmailStep loading={loading} error={error} onSubmit={requestOtp} />
        ) : (
          <OtpStep
            email={email}
            loading={loading}
            error={error}
            resendSecondsLeft={secondsLeft}
            onVerify={verifyOtp}
            onResend={() => requestOtp(email)}
            onChangeEmail={() => {
              setStep("email");
              setError(null);
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-8 flex items-center justify-center gap-2 text-xs text-base-content/40"
      >
        Restricted area. Authorized personnel only.
      </motion.div>
    </>
  );
}
