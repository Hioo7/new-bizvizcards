import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@features/auth/schemas/loginSchema";
import FormTextField from "@components/forms/FormTextField";
import PasswordField from "@features/auth/components/PasswordField";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import SocialLoginButtons from "@features/auth/components/SocialLoginButtons";
import { useAuth } from "@hooks/useAuth";
import { ApiError } from "@services/apiClient";
import { ROUTES } from "@config/routes";
import {
  ERROR_RIBBON_DURATION_MS,
  GENERIC_LOGIN_ERROR_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
} from "@features/auth/config";

export default function LoginForm() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(
      () => setErrorMessage(null),
      ERROR_RIBBON_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    try {
      await signIn(values);
      // TODO: redirect to the customer's real post-login destination
      // (dashboard/eshop) once those pages are migrated — for now we send
      // everyone back to the landing page.
      navigate(ROUTES.landing);
    } catch (err) {
      if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
        setErrorMessage(INVALID_CREDENTIALS_MESSAGE);
      } else if (err instanceof Error) {
        setErrorMessage(err.message || GENERIC_LOGIN_ERROR_MESSAGE);
      } else {
        setErrorMessage(GENERIC_LOGIN_ERROR_MESSAGE);
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6 flex justify-end"
      >
        <p className="text-sm text-base-content/60">
          Don&apos;t have an account?{" "}
          <Link
            to={ROUTES.signup}
            className="font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Sign Up
          </Link>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="mb-1 text-2xl font-bold text-base-content sm:text-3xl">
          Welcome Back!
        </h1>
        <p className="text-sm text-base-content/60">
          Log in to your BizVizCards account
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.4 }}
        >
          <FormTextField
            id="login-email"
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
          transition={{ delay: 0.34, duration: 0.4 }}
        >
          <PasswordField
            id="login-password"
            label="Password"
            autoComplete="current-password"
            registration={register("password")}
            error={errors.password?.message}
            belowField={
              <div className="mt-1.5 flex justify-end">
                <Link
                  to="#"
                  className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>
            }
          />
        </motion.div>

        <FormErrorRibbon message={errorMessage} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.4 }}
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
                Signing in...
              </span>
            ) : (
              "Log In"
            )}
          </motion.button>
        </motion.div>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="my-6 flex items-center gap-3"
      >
        <div className="h-px flex-1 bg-base-300" />
        <span className="text-xs font-medium text-base-content/40">
          or continue with
        </span>
        <div className="h-px flex-1 bg-base-300" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      >
        <SocialLoginButtons />
      </motion.div>

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
