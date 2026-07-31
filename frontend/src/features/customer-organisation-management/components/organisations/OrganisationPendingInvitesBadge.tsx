interface OrganisationPendingInvitesBadgeProps {
  count: number;
}

const MAX_DISPLAYED_COUNT = 99;

// WhatsApp-style unread-count badge, overlaid on the org avatar — lets an
// admin scanning a long organisation list spot which ones have invites
// waiting to be resolved without opening each one.
export default function OrganisationPendingInvitesBadge({
  count,
}: OrganisationPendingInvitesBadgeProps) {
  if (count <= 0) return null;

  const label = `${count} pending invite${count === 1 ? "" : "s"}`;

  return (
    <span
      aria-label={label}
      title={label}
      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-error-content"
    >
      {count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : count}
    </span>
  );
}
