import { Crown, ShieldCheck, User } from "lucide-react";
import type { StaffRole } from "@app-types/staffAuth";

const ROLE_AVATAR_ICON: Record<StaffRole, typeof User> = {
  employee: User,
  admin: ShieldCheck,
  super_admin: Crown,
};

const ROLE_AVATAR_CLASSES: Record<StaffRole, string> = {
  employee: "bg-base-300 text-base-content/70",
  admin: "bg-secondary/15 text-secondary",
  super_admin: "bg-primary/15 text-primary",
};

interface StaffAvatarProps {
  role: StaffRole | null;
  size?: "sm" | "md";
}

const SIZE_CLASSES: Record<"sm" | "md", { wrapper: string; icon: string }> = {
  sm: { wrapper: "h-8 w-8", icon: "h-3.5 w-3.5" },
  md: { wrapper: "h-9 w-9", icon: "h-4 w-4" },
};

export default function StaffAvatar({ role, size = "md" }: StaffAvatarProps) {
  const Icon = role ? ROLE_AVATAR_ICON[role] : User;
  const colorClasses = role ? ROLE_AVATAR_CLASSES[role] : "bg-base-300 text-base-content/70";
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${sizeClasses.wrapper} ${colorClasses}`}
    >
      <Icon className={sizeClasses.icon} />
    </span>
  );
}
