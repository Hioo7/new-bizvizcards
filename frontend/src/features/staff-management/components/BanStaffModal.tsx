import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban } from "lucide-react";
import type { StaffMember } from "@app-types/staffAuth";
import {
  banStaffSchema,
  type BanStaffValues,
} from "@features/staff-management/schemas/banStaffSchema";

interface BanStaffModalProps {
  open: boolean;
  staff: StaffMember | null;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: BanStaffValues) => void;
}

export default function BanStaffModal({
  open,
  staff,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: BanStaffModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BanStaffValues>({ resolver: zodResolver(banStaffSchema) });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reset({ banReason: "" });
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, reset]);

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onCancel}>
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warning/10">
            <Ban className="h-5 w-5 text-warning" />
          </div>
          <h3 className="text-lg font-bold text-base-content">
            Ban {staff?.name}?
          </h3>
        </div>
        <p className="mt-3 text-sm text-base-content/60">
          They&apos;ll be signed out and won&apos;t be able to log back in until unbanned.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
          <label htmlFor="banReason" className="mb-1.5 block text-xs font-semibold text-base-content/70">
            Reason (optional)
          </label>
          <textarea
            id="banReason"
            rows={3}
            {...register("banReason")}
            className={`w-full rounded-field border bg-base-200 px-3 py-2.5 text-sm text-base-content focus:bg-base-100 focus:outline-none ${
              errors.banReason ? "border-error focus:border-error" : "border-base-300 focus:border-primary"
            }`}
          />
          {errors.banReason && (
            <p className="mt-1.5 text-xs text-error">{errors.banReason.message}</p>
          )}
          {error && <p className="mt-3 text-sm text-error">{error}</p>}

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
              className="btn min-h-11 gap-2 rounded-field bg-warning text-white hover:bg-warning/90"
            >
              {isSubmitting && <span className="loading loading-spinner loading-sm" />}
              Ban
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
