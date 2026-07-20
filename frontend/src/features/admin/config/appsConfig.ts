import {
  Building2,
  CalendarDays,
  Contact,
  CreditCard,
  DatabaseZap,
  IdCard,
  LogOut,
  Package,
  Route as RouteIcon,
  ShoppingBag,
  UserCircle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@config/routes";
import type { StaffRole } from "@app-types/staffAuth";

export type AdminAppTileColor = "primary" | "secondary" | "accent" | "neutral";

export interface AdminAppTile {
  id: string;
  label: string;
  icon: LucideIcon;
  color: AdminAppTileColor;
  route?: string;
  action?: "logout";
  /** Tile is hidden from the grid unless the viewing staff member's role
   * matches — currently only used to hide Data Migration from non-super-admins.
   * The route itself is also hard-gated separately (RequireSuperAdmin), this
   * is purely to avoid showing a tile that would just redirect on click. */
  requiredRole?: StaffRole;
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
    id: "products",
    label: "Products",
    icon: Package,
    color: "accent",
    route: ROUTES.adminProducts,
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingBag,
    color: "primary",
    route: ROUTES.adminOrders,
  },
  {
    id: "data-migration",
    label: "Data Migration",
    icon: DatabaseZap,
    color: "secondary",
    route: ROUTES.adminDataMigration,
    requiredRole: "super_admin",
  },
  {
    id: "logout",
    label: "Log out",
    icon: LogOut,
    color: "neutral",
    action: "logout",
  },
];
