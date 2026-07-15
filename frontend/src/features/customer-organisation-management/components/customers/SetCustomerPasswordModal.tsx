import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import type { Customer } from "@app-types/customer";
import PasswordField from "@components/forms/PasswordField";
import {
  setCustomerPasswordSchema,
  type SetCustomerPasswordValues,
} from "@features/customer-organisation-management/schemas/setCustomerPasswordSchema";

interface SetCustomerPasswordModalProps {
  open: boolean;
  customer: Customer | null;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: SetCustomerPasswordValues) => void;
}

export default function SetCustomerPasswordModal({
  open,
  customer,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: SetCustomerPasswordModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SetCustomerPasswordValues>({
    resolver: zodResolver(setCustomerPasswordSchema),
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reset({ newPassword: "" });
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, reset]);

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onCancel}
    >
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">
            Set password for {customer?.name}
          </h3>
        </div>
        <p className="mt-3 text-sm text-base-content/60">
          This takes effect immediately. Share the new password with the
          customer yourself.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 flex flex-col gap-4"
        >
          <PasswordField
            id="set-customer-password"
            label="New password"
            registration={register("newPassword")}
            error={errors.newPassword?.message}
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
              Set password
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
