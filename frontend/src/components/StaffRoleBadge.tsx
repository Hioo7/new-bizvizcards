import type { StaffRole } from "@app-types/staffAuth";
import { STAFF_ROLE_LABELS } from "@config/staffRoles";

const ROLE_BADGE_CLASSES: Record<StaffRole, string> = {
  employee: "bg-base-300 text-base-content/70",
  admin: "bg-secondary/15 text-secondary",
  super_admin: "bg-primary/15 text-primary",
};

interface StaffRoleBadgeProps {
  role: StaffRole | null;
}

export default function StaffRoleBadge({ role }: StaffRoleBadgeProps) {
  if (!role) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${ROLE_BADGE_CLASSES[role]}`}
    >
      {STAFF_ROLE_LABELS[role]}
    </span>
  );
}
