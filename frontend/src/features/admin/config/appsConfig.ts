import { IdCard, LogOut, UserCircle, Users } from "lucide-react";
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
    id: "logout",
    label: "Log out",
    icon: LogOut,
    color: "neutral",
    action: "logout",
  },
];
