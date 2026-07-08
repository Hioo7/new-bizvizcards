import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import { OTP_LENGTH } from "@features/admin/config";

const EMPTY_OTP = Array<string>(OTP_LENGTH).fill("");

interface OtpStepProps {
  email: string;
  loading: boolean;
  error: string | null;
  resendSecondsLeft: number;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}

export default function OtpStep({
  email,
  loading,
  error,
  resendSecondsLeft,
  onVerify,
  onResend,
  onChangeEmail,
}: OtpStepProps) {
  const [digits, setDigits] = useState<string[]>(EMPTY_OTP);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const resetDigits = () => {
    setDigits(EMPTY_OTP);
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && index === OTP_LENGTH - 1 && next.every((d) => d !== "")) {
      onVerify(next.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      e.preventDefault();
      setDigits(pasted.split(""));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      onVerify(pasted);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(digits.join(""));
  };

  return (
    <motion.div
      key="otp-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <button
        type="button"
        onClick={() => {
          onChangeEmail();
          resetDigits();
        }}
        className="mb-8 inline-flex min-h-11 items-center gap-1 text-sm text-base-content/60 transition-colors hover:text-base-content"
      >
        <ChevronLeft className="h-4 w-4" />
        Change email
      </button>

      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold text-base-content sm:text-3xl">
          Check your inbox
        </h1>
        <p className="text-sm text-base-content/60">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-base-content">{email}</span>.
          <br />
          Enter it below to sign in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-11 rounded-field border-2 border-base-300 bg-base-200 text-center text-xl font-bold text-base-content caret-transparent transition focus:border-primary focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:h-16 sm:w-13"
            />
          ))}
        </div>

        <FormErrorRibbon message={error} />

        <motion.button
          type="submit"
          whileHover={!loading ? { scale: 1.01 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          disabled={loading}
          className="btn min-h-11 w-full rounded-field border-none bg-primary text-sm font-semibold text-primary-content shadow-md hover:bg-primary/90 disabled:bg-base-300 disabled:text-base-content/40 disabled:shadow-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="loading loading-spinner loading-xs" />
              Verifying...
            </span>
          ) : (
            "Sign In"
          )}
        </motion.button>

        <p className="text-center text-sm text-base-content/60">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={() => {
              onResend();
              resetDigits();
            }}
            disabled={resendSecondsLeft > 0 || loading}
            className={`min-h-11 font-medium transition-colors ${
              resendSecondsLeft > 0 || loading
                ? "cursor-not-allowed text-base-content/30"
                : "text-primary hover:text-primary/80"
            }`}
          >
            {resendSecondsLeft > 0
              ? `Resend in ${resendSecondsLeft}s`
              : "Resend code"}
          </button>
        </p>
      </form>
    </motion.div>
  );
}
