import { ClipboardList, ImageIcon, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EffectivePolicy } from "@app-types/plan";
import { ROUTES } from "@config/routes";

export interface UserAppTile {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  /** True when the viewing customer's own plan doesn't include this app —
   * the tile stays visible (so it's discoverable) but renders locked. */
  isLocked: (policy: EffectivePolicy) => boolean;
}

export const USER_APP_TILES: UserAppTile[] = [
  {
    id: "exchange-contact-forms",
    label: "Exchange Contact Forms",
    icon: ClipboardList,
    route: ROUTES.userExchangeContactForms,
    isLocked: (policy) => !policy.ecard.isCustomFormAvailable,
  },
  {
    id: "email-signatures",
    label: "Email Signatures",
    icon: Mail,
    route: ROUTES.userEmailSignatures,
    isLocked: (policy) => !policy.emailSignature.isAvailable,
  },
  {
    id: "virtual-backgrounds",
    label: "Virtual Backgrounds",
    icon: ImageIcon,
    route: ROUTES.userVirtualBackgrounds,
    isLocked: (policy) => !policy.virtualBackground.isAvailable,
  },
];
