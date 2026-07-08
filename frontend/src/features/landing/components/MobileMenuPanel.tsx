import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ROUTES } from "@config/routes";
import { NAV_LINKS } from "@features/landing/config/content";

interface MobileMenuPanelProps {
  open: boolean;
  onLinkClick: () => void;
}

export default function MobileMenuPanel({
  open,
  onLinkClick,
}: MobileMenuPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="space-y-3 overflow-hidden border-t border-base-300 bg-base-100 px-4 py-4 md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block min-h-11 py-2 text-sm text-base-content/80"
              onClick={onLinkClick}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Link
              to={ROUTES.login}
              className="flex-1 rounded-md border border-base-300 px-4 py-2 text-center text-sm font-medium text-base-content/80"
            >
              Login
            </Link>
            <Link
              to={ROUTES.signup}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-content"
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
