import { Pencil, Plus } from "lucide-react";
import type { OrganisationMemberLinkedEcard } from "@app-types/ecard";

interface LinkedEcardButtonProps {
  memberName: string;
  linkedEcard: OrganisationMemberLinkedEcard | null;
  onClick: () => void;
  /** "row" = borderless icon button (desktop table row), "card" = bordered
   * square button matching the other bordered actions on the mobile card. */
  variant?: "row" | "card";
}

/** Doubles as an indicator: an unfilled reddish plus means no e-card is
 * linked to this organisation yet (needs action); a pencil means one is
 * linked already (click to switch it). Both open the same link/switch modal. */
export default function LinkedEcardButton({
  memberName,
  linkedEcard,
  onClick,
  variant = "row",
}: LinkedEcardButtonProps) {
  const sizeClass =
    variant === "row" ? "min-h-9 min-w-9" : "min-h-11 min-w-11 border border-base-300";

  if (!linkedEcard) {
    return (
      <button
        type="button"
        aria-label={`Link an e-card for ${memberName}`}
        title="No e-card linked to this organisation yet"
        onClick={onClick}
        className={`flex items-center justify-center rounded-field bg-error/10 text-error hover:bg-error/20 ${sizeClass}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Switch the linked e-card for ${memberName}`}
      title={`Linked: ${linkedEcard.heroName}`}
      onClick={onClick}
      className={`flex items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary ${sizeClass}`}
    >
      <Pencil className="h-4 w-4" />
    </button>
  );
}
