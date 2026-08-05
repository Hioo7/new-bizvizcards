import { ClipboardList } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@config/routes";

export interface UserAppTile {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  /** True when the viewing customer's own plan doesn't include this app —
   * the tile stays visible (so it's discoverable) but renders locked. */
  isLocked: (args: { isCustomFormAvailable: boolean }) => boolean;
}

export const USER_APP_TILES: UserAppTile[] = [
  {
    id: "exchange-contact-forms",
    label: "Exchange Contact Forms",
    icon: ClipboardList,
    route: ROUTES.userExchangeContactForms,
    isLocked: ({ isCustomFormAvailable }) => !isCustomFormAvailable,
  },
];
