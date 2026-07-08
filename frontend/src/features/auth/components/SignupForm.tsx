import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail, User } from "lucide-react";
import { signupSchema, type SignupFormValues } from "@features/auth/schemas/signupSchema";
import FormTextField from "@components/forms/FormTextField";
import PasswordField from "@features/auth/components/PasswordField";
import PasswordStrengthMeter from "@features/auth/components/PasswordStrengthMeter";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import { useAuth } from "@hooks/useAuth";
import { ROUTES } from "@config/routes";
import { ERROR_RIBBON_DURATION_MS, GENERIC_SIGNUP_ERROR_MESSAGE } from "@features/auth/config";

export default function SignupForm() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const passwordRegistration = register("password", {
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setPasswordValue(event.target.value),
  });

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(
      () => setErrorMessage(null),
      ERROR_RIBBON_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const onSubmit = async (values: SignupFormValues) => {
    setErrorMessage(null);
    try {
      await signUp({
        name: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      // TODO: redirect to the customer's real post-signup destination
      // (dashboard/eshop) once those pages are migrated — for now we send
      // everyone back to the landing page.
      navigate(ROUTES.landing);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : GENERIC_SIGNUP_ERROR_MESSAGE,
      );
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-5 flex justify-end"
      >
        <p className="text-sm text-base-content/60">
          Already have an account?{" "}
          <Link
            to={ROUTES.login}
            className="font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Sign In
          </Link>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="mb-1 text-2xl font-bold text-base-content sm:text-3xl">
          Create Account
        </h1>
        <p className="text-sm text-base-content/60">
          Join BizVizCards and start networking smarter
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.4 }}
        >
          <FormTextField
            id="signup-name"
            type="text"
            label="Full Name"
            icon={User}
            autoComplete="name"
            registration={register("fullName")}
            error={errors.fullName?.message}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.33, duration: 0.4 }}
        >
          <FormTextField
            id="signup-email"
            type="email"
            label="Email Address"
            icon={Mail}
            autoComplete="email"
            registration={register("email")}
            error={errors.email?.message}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <PasswordField
            id="signup-password"
            label="Password"
            autoComplete="new-password"
            registration={passwordRegistration}
            error={errors.password?.message}
            belowField={<PasswordStrengthMeter password={passwordValue} />}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.47, duration: 0.4 }}
        >
          <PasswordField
            id="signup-confirm"
            label="Confirm Password"
            autoComplete="new-password"
            registration={register("confirm")}
            error={errors.confirm?.message}
          />
        </motion.div>

        <FormErrorRibbon message={errorMessage} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.54, duration: 0.4 }}
        >
          <motion.button
            type="submit"
            whileHover={!isSubmitting ? { scale: 1.01 } : {}}
            whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            disabled={isSubmitting}
            className="btn min-h-11 w-full rounded-field border-none bg-primary text-sm font-semibold text-primary-content shadow-md hover:bg-primary/90 disabled:bg-base-300 disabled:text-base-content/40 disabled:shadow-none"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-xs" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </motion.button>
        </motion.div>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.62, duration: 0.4 }}
        className="mt-6 flex items-center justify-center gap-2 text-xs text-base-content/40"
      >
        Your data is secure with us. We never share your information.
      </motion.div>
    </>
  );
}
