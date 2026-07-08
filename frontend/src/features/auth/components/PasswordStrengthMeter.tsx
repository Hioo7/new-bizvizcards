import { motion } from "framer-motion";
import { getPasswordStrength } from "@features/auth/utils/passwordStrength";

const LEVEL_COLOR_CLASS: Record<number, string> = {
  1: "bg-error",
  2: "bg-warning",
  3: "bg-success",
};

const LABEL_TEXT_CLASS: Record<number, string> = {
  1: "text-error",
  2: "text-warning",
  3: "text-success",
};

interface PasswordStrengthMeterProps {
  password: string;
}

export default function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="mb-1 flex gap-1">
        {[1, 2, 3].map((segment) => (
          <div
            key={segment}
            className="h-1 flex-1 overflow-hidden rounded-full bg-base-300"
          >
            <motion.div
              className={
                strength.level >= segment ? LEVEL_COLOR_CLASS[segment] : ""
              }
              initial={{ width: 0 }}
              animate={{ width: strength.level >= segment ? "100%" : "0%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ height: "100%" }}
            />
          </div>
        ))}
      </div>
      <p className={`text-xs ${LABEL_TEXT_CLASS[strength.level] ?? ""}`}>
        {strength.label}
      </p>
    </div>
  );
}
