import { Building2, Eye, Pencil, Trash2 } from "lucide-react";
import type { SmartCard } from "@app-types/smartCard";

interface SmartCardListItemProps {
  card: SmartCard;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}

export default function SmartCardListItem({
  card,
  onEdit,
  onDelete,
  onPreview,
}: SmartCardListItemProps) {
  const displayName = card.profile?.companyName || card.endpoint;

  return (
    <div className="flex items-center gap-3 border-b border-base-300 px-4 py-3.5 last:border-b-0 hover:bg-base-200/50">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
        {card.profile?.logoUrl ? (
          <img src={card.profile.logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Building2 className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-base-content">{displayName}</p>
        <p className="truncate font-mono text-xs text-base-content/50">/{card.endpoint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Preview ${displayName}`}
          onClick={onPreview}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Edit ${displayName}`}
          onClick={onEdit}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${displayName}`}
          onClick={onDelete}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
