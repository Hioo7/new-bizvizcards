import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User, UserPlus } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import {
  createStaffSchema,
  type CreateStaffValues,
} from "@features/staff-management/schemas/createStaffSchema";
import { STAFF_ASSIGNABLE_ROLE_OPTIONS } from "@features/staff-management/config";

interface CreateStaffModalProps {
  open: boolean;
  canAssignRole: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: CreateStaffValues) => void;
}

export default function CreateStaffModal({
  open,
  canAssignRole,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: CreateStaffModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { email: "", name: "", role: "employee" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reset({ email: "", name: "", role: "employee" });
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, reset]);

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onCancel}>
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">Add staff</h3>
        </div>
        <p className="mt-3 text-sm text-base-content/60">
          They&apos;ll sign in themselves at the staff login using this email.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
          <FormTextField
            id="staff-name"
            label="Name"
            icon={User}
            registration={register("name")}
            error={errors.name?.message}
          />
          <FormTextField
            id="staff-email"
            label="Email"
            icon={Mail}
            type="email"
            registration={register("email")}
            error={errors.email?.message}
          />

          {canAssignRole && (
            <div>
              <label htmlFor="staff-role" className="mb-1.5 block text-xs font-semibold text-base-content/70">
                Role
              </label>
              <select
                id="staff-role"
                {...register("role")}
                className="w-full min-h-11 rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
              >
                {STAFF_ASSIGNABLE_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {isSubmitting && <span className="loading loading-spinner loading-sm" />}
              Add staff
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
