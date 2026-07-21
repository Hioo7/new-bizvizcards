import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UsersRound } from "lucide-react";
import BulkCustomerPickerField from "@components/BulkCustomerPickerField";
import type { Customer } from "@app-types/customer";
import type { PlanSummary } from "@app-types/plan";
import {
  bulkAssignPlanCustomersSchema,
  type BulkAssignPlanCustomersValues,
} from "@features/plans/schemas/bulkAssignPlanCustomersSchema";

interface BulkAssignCustomersToPlanModalProps {
  open: boolean;
  plan: PlanSummary | null;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: BulkAssignPlanCustomersValues) => void;
}

export default function BulkAssignCustomersToPlanModal({
  open,
  plan,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: BulkAssignCustomersToPlanModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const {
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BulkAssignPlanCustomersValues>({
    resolver: zodResolver(bulkAssignPlanCustomersSchema),
    defaultValues: { customerIds: [] },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reset({ customerIds: [] });
      setSelectedCustomers([]);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, reset]);

  function handleSelectionChange(customers: Customer[]) {
    setSelectedCustomers(customers);
    setValue(
      "customerIds",
      customers.map((c) => c.id),
      { shouldValidate: true },
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onCancel}
    >
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <UsersRound className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-base-content">
              Bulk add customers
            </h3>
            {plan && (
              <p className="truncate text-xs text-base-content/50">
                Link customers to &quot;{plan.name}&quot;
              </p>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 flex flex-col gap-4"
        >
          <BulkCustomerPickerField
            label="Customers"
            selectedCustomers={selectedCustomers}
            onSelectionChange={handleSelectionChange}
            error={errors.customerIds?.message}
          />

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="modal-action">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedCustomers.length === 0}
              className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
            >
              {isSubmitting && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {selectedCustomers.length > 0
                ? `Link ${selectedCustomers.length} ${selectedCustomers.length === 1 ? "customer" : "customers"}`
                : "Link customers"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
