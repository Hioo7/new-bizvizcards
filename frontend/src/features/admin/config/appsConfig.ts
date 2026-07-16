import {
  Building2,
  CalendarDays,
  Contact,
  CreditCard,
  IdCard,
  LogOut,
  Route as RouteIcon,
  UserCircle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@config/routes";

export type AdminAppTileColor = "primary" | "secondary" | "accent" | "neutral";

export interface AdminAppTile {
  id: string;
  label: string;
  icon: LucideIcon;
  color: AdminAppTileColor;
  route?: string;
  action?: "logout";
}

export const ADMIN_APP_TILES: AdminAppTile[] = [
  {
    id: "staff-management",
    label: "Staff Management",
    icon: Users,
    color: "primary",
    route: ROUTES.adminStaff,
  },
  {
    id: "profile",
    label: "Profile",
    icon: UserCircle,
    color: "secondary",
    route: ROUTES.adminProfile,
  },
  {
    id: "smart-cards",
    label: "Smart Cards",
    icon: IdCard,
    color: "accent",
    route: ROUTES.adminSmartCards,
  },
  {
    id: "redirects",
    label: "Redirects",
    icon: RouteIcon,
    color: "primary",
    route: ROUTES.adminRedirects,
  },
  {
    id: "e-cards",
    label: "E-cards",
    icon: Contact,
    color: "secondary",
    route: ROUTES.adminEcards,
  },
  {
    id: "customer-organisation-management",
    label: "Customers & Organisations",
    icon: Building2,
    color: "accent",
    route: ROUTES.adminCustomerOrganisations,
  },
  {
    id: "plans",
    label: "Plans",
    icon: CreditCard,
    color: "primary",
    route: ROUTES.adminPlans,
  },
  {
    id: "business-events",
    label: "Business Events",
    icon: CalendarDays,
    color: "secondary",
    route: ROUTES.adminBusinessEvents,
  },
  {
    id: "logout",
    label: "Log out",
    icon: LogOut,
    color: "neutral",
    action: "logout",
  },
];
