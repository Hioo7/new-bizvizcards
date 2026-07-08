import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import {
  emailStepSchema,
  type EmailStepValues,
} from "@features/admin/schemas/emailStepSchema";

interface EmailStepProps {
  loading: boolean;
  error: string | null;
  onSubmit: (email: string) => void;
}

export default function EmailStep({ loading, error, onSubmit }: EmailStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailStepValues>({
    resolver: zodResolver(emailStepSchema),
    mode: "onChange",
  });

  return (
    <motion.div
      key="email-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold text-base-content sm:text-3xl">
          Welcome Back!
        </h1>
        <p className="text-sm text-base-content/60">
          Enter your email to receive a one-time login code.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((values) => onSubmit(values.email))}
        className="space-y-4"
        noValidate
      >
        <FormTextField
          id="admin-email"
          type="email"
          label="Email Address"
          icon={Mail}
          autoComplete="email"
          autoFocus
          registration={register("email")}
          error={errors.email?.message}
        />

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
              Sending code...
            </span>
          ) : (
            "Continue with Email"
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
