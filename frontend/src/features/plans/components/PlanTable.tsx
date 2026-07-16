import { CreditCard } from "lucide-react";
import type { PlanSummary } from "@app-types/plan";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import PlanRow from "@features/plans/components/PlanRow";
import PlanCard from "@features/plans/components/PlanCard";

interface PlanTableProps {
  plans: PlanSummary[];
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  canDelete: boolean;
  onEdit: (plan: PlanSummary) => void;
  onSetFallback: (plan: PlanSummary) => void;
  onDelete: (plan: PlanSummary) => void;
}

export default function PlanTable({
  plans,
  isLoading,
  error,
  hasActiveFilters,
  canDelete,
  onEdit,
  onSetFallback,
  onDelete,
}: PlanTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return <FormErrorRibbon message={error} />;
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <CreditCard className="h-8 w-8 text-base-content/30" />
        <p className="text-sm text-base-content/60">
          {hasActiveFilters ? "No plans match your search." : "No plans yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <tbody>
          {plans.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              canDelete={canDelete}
              onEdit={() => onEdit(plan)}
              onSetFallback={() => onSetFallback(plan)}
              onDelete={() => onDelete(plan)}
            />
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            canDelete={canDelete}
            onEdit={() => onEdit(plan)}
            onSetFallback={() => onSetFallback(plan)}
            onDelete={() => onDelete(plan)}
          />
        ))}
      </div>
    </>
  );
}
