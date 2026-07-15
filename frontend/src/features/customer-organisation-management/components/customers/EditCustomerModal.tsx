import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Pencil, User } from "lucide-react";
import type { Customer } from "@app-types/customer";
import FormTextField from "@components/forms/FormTextField";
import {
  editCustomerSchema,
  type EditCustomerValues,
} from "@features/customer-organisation-management/schemas/editCustomerSchema";

interface EditCustomerModalProps {
  open: boolean;
  customer: Customer | null;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: EditCustomerValues) => void;
}

export default function EditCustomerModal({
  open,
  customer,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: EditCustomerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditCustomerValues>({ resolver: zodResolver(editCustomerSchema) });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // The close path must not depend on `customer` — the parent clears it to
    // null in the same state update that flips `open` to false, so gating
    // the whole effect on `customer` would strand the dialog open forever.
    if (open && customer && !dialog.open) {
      reset({ name: customer.name, email: customer.email });
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, customer, reset]);

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onCancel}
    >
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Pencil className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">
            Edit customer
          </h3>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 flex flex-col gap-4"
        >
          <FormTextField
            id="edit-customer-name"
            label="Name"
            icon={User}
            registration={register("name")}
            error={errors.name?.message}
          />
          <FormTextField
            id="edit-customer-email"
            label="Email"
            icon={Mail}
            type="email"
            registration={register("email")}
            error={errors.email?.message}
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
              disabled={isSubmitting}
              className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
            >
              {isSubmitting && (
                <span className="loading loading-spinner loading-sm" />
              )}
              Save changes
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
