import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import BulkCustomerPickerField from "@components/BulkCustomerPickerField";
import type { Customer } from "@app-types/customer";
import {
  addOrganisationMemberSchema,
  type AddOrganisationMemberValues,
} from "@features/customer-organisation-management/schemas/addOrganisationMemberSchema";

interface AddOrganisationMemberModalProps {
  open: boolean;
  /** Existing member customerIds — hidden from the picker's search results. */
  excludeCustomerIds: string[];
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: AddOrganisationMemberValues) => void;
}

export default function AddOrganisationMemberModal({
  open,
  excludeCustomerIds,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: AddOrganisationMemberModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const {
    handleSubmit,
    register,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddOrganisationMemberValues>({
    resolver: zodResolver(addOrganisationMemberSchema),
    defaultValues: { customerIds: [], role: "MEMBER" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reset({ customerIds: [], role: "MEMBER" });
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
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">Add members</h3>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 flex flex-col gap-4"
        >
          <BulkCustomerPickerField
            label="New members"
            selectedCustomers={selectedCustomers}
            onSelectionChange={handleSelectionChange}
            excludeCustomerIds={excludeCustomerIds}
            error={errors.customerIds?.message}
          />

          <div>
            <label
              htmlFor="add-member-role"
              className="mb-1.5 block text-xs font-semibold text-base-content/70"
            >
              Add as
            </label>
            <select
              id="add-member-role"
              {...register("role")}
              className="w-full min-h-11 rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
            >
              <option value="MEMBER">Member</option>
              <option value="SPOC">SPOC</option>
            </select>
          </div>

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
                ? `Add ${selectedCustomers.length} ${selectedCustomers.length === 1 ? "member" : "members"}`
                : "Add members"}
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
