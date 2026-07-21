import { CreditCard, Pencil, Star, Trash2, UsersRound } from "lucide-react";
import type { PlanSummary } from "@app-types/plan";

interface PlanRowProps {
  plan: PlanSummary;
  canDelete: boolean;
  onEdit: () => void;
  onSetFallback: () => void;
  onDelete: () => void;
  onBulkAssign: () => void;
}

export default function PlanRow({
  plan,
  canDelete,
  onEdit,
  onSetFallback,
  onDelete,
  onBulkAssign,
}: PlanRowProps) {
  return (
    <tr className="border-b border-base-300 last:border-b-0 hover:bg-base-200/50">
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/60">
            <CreditCard className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-base-content">{plan.name}</p>
            <p className="text-xs text-base-content/50">
              {plan.businessModelType}
              {plan.isFallbackPlan && (
                <span className="ml-2 rounded-full bg-warning/10 px-2 py-0.5 font-semibold text-warning">
                  Fallback
                </span>
              )}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 pl-3 pr-3 text-sm text-base-content/70">
        ₹{plan.price}
      </td>
      <td className="py-3 pl-3 pr-4">
        <div className="flex items-center justify-end gap-1">
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
      </td>
    </tr>
  );
}
