import { CreditCard, Pencil, Star, Trash2, UsersRound } from "lucide-react";
import type { PlanSummary } from "@app-types/plan";

interface PlanCardProps {
  plan: PlanSummary;
  canDelete: boolean;
  onEdit: () => void;
  onSetFallback: () => void;
  onDelete: () => void;
  onBulkAssign: () => void;
}

export default function PlanCard({
  plan,
  canDelete,
  onEdit,
  onSetFallback,
  onDelete,
  onBulkAssign,
}: PlanCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-box border border-base-300 bg-base-100 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/60">
          <CreditCard className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-base-content">
            {plan.name}
          </p>
          <p className="text-xs text-base-content/50">
            ₹{plan.price} · {plan.businessModelType}
            {plan.isFallbackPlan && (
              <span className="ml-2 rounded-full bg-warning/10 px-2 py-0.5 font-semibold text-warning">
                Fallback
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label="Bulk add customers to plan"
          onClick={onBulkAssign}
          className="flex h-9 w-9 items-center justify-center rounded-full text-base-content/60 hover:bg-base-300 hover:text-base-content"
        >
          <UsersRound className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Edit plan"
          onClick={onEdit}
          className="flex h-9 w-9 items-center justify-center rounded-full text-base-content/60 hover:bg-base-300 hover:text-base-content"
        >
          <Pencil className="h-4 w-4" />
        </button>
        {!plan.isFallbackPlan && (
          <button
            type="button"
            aria-label="Set as fallback plan"
            onClick={onSetFallback}
            className="flex h-9 w-9 items-center justify-center rounded-full text-base-content/60 hover:bg-base-300 hover:text-warning"
          >
            <Star className="h-4 w-4" />
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            aria-label="Delete plan"
            onClick={onDelete}
            className="flex h-9 w-9 items-center justify-center rounded-full text-base-content/60 hover:bg-error/10 hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
