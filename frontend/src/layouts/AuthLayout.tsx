import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import bizvizLogo from "@assets/brand/bizvizlogo.svg";
import sideImage from "@assets/auth/sideimage.png";
import { ROUTES } from "@config/routes";

const TRUST_BADGES = [
  { icon: "⚡", text: "Instant sharing" },
  { icon: "📊", text: "Real-time analytics" },
];

interface AuthLayoutProps {
  promoHeading: ReactNode;
  promoSubtext: string;
  children: ReactNode;
}

export default function AuthLayout({
  promoHeading,
  promoSubtext,
  children,
}: AuthLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base-100">
      <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-base-300 bg-base-100/80 px-6 py-4 backdrop-blur-sm">
        <Link to={ROUTES.landing} className="flex items-center gap-2">
          <img
            src={bizvizLogo}
            alt="BizVizCards"
            className="block h-9 w-auto object-contain"
          />
        </Link>
        <p className="hidden text-xs font-medium tracking-wide text-base-content/60 md:block">
          Smarter connections. Better business.
        </p>
        <Link
          to={ROUTES.landing}
          aria-label="Back to home"
          className="relative inline-flex items-center gap-1.5 text-sm text-base-content/60 transition-colors before:absolute before:-inset-y-3 before:inset-x-0 before:content-[''] hover:text-base-content"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>
      </nav>

      <main className="flex flex-1 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex w-full flex-col overflow-hidden bg-base-100 md:flex-row"
        >
          <div
            className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex md:w-[52%]"
            style={{
              backgroundImage:
                "linear-gradient(to bottom right, var(--color-auth-gradient-1), var(--color-auth-gradient-2), var(--color-auth-gradient-3))",
            }}
          >
            <div
              className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full blur-3xl"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-auth-glow-blue) 40%, transparent)",
              }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -right-8 h-56 w-56 rounded-full blur-3xl"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-auth-glow-indigo) 40%, transparent)",
              }}
            />

            <div className="relative z-10">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary"
              >
                ⚡ Smart Digital Cards
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="mb-4 text-3xl font-extrabold leading-tight text-base-content lg:text-4xl"
              >
                {promoHeading}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="max-w-xs text-base leading-relaxed text-base-content/60"
              >
                {promoSubtext}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="relative z-10 my-8 flex justify-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-full"
              >
                <div className="relative mx-auto aspect-square w-full max-w-[420px]">
                  <img
                    src={sideImage}
                    alt="BizVizCards illustration"
                    className="h-full w-full object-contain drop-shadow-xl"
                  />
                </div>
              </motion.div>
            </motion.div>

            <div className="relative z-10 flex flex-wrap gap-3">
              {TRUST_BADGES.map((badge, i) => (
                <motion.div
                  key={badge.text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
                  className="flex items-center gap-1.5 rounded-full border border-base-100/80 bg-base-100/70 px-3 py-1.5 text-xs font-medium text-base-content shadow-sm backdrop-blur-sm"
                >
                  <span>{badge.icon}</span>
                  {badge.text}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-10 sm:px-10 md:px-12">
            {children}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
