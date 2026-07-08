import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import bizvizLogo from "@assets/brand/bizvizlogo.svg";
import { ROUTES } from "@config/routes";
import { NAV_LINKS } from "@features/landing/config/content";
import { useScrolled } from "@features/landing/hooks/useScrolled";
import MobileMenuPanel from "@features/landing/components/MobileMenuPanel";

export default function Navbar() {
  const scrolled = useScrolled();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-base-300 transition-all duration-300 ${
        scrolled ? "bg-base-100/90 shadow-md backdrop-blur-md" : "bg-base-100 shadow-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={ROUTES.landing}>
          <img src={bizvizLogo} alt="BizVizCards" className="block h-10 w-auto" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-base-content/70 transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to={ROUTES.login}
            className="rounded-md border border-base-300 px-4 py-2 text-sm font-medium text-base-content/80 transition-colors hover:bg-base-200"
          >
            Login
          </Link>
          <Link
            to={ROUTES.signup}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-content transition-colors hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-base-content/70 md:hidden"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <MobileMenuPanel
        open={mobileMenuOpen}
        onLinkClick={() => setMobileMenuOpen(false)}
      />
    </nav>
  );
}
