import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, User } from "lucide-react";
import { updateStaffProfile } from "@services/staffAuthService";
import FormTextField from "@components/forms/FormTextField";
import {
  updateProfileSchema,
  type UpdateProfileValues,
} from "@features/admin/schemas/updateProfileSchema";

interface EditNameModalProps {
  open: boolean;
  currentName: string;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}

export default function EditNameModal({
  open,
  currentName,
  onCancel,
  onSaved,
}: EditNameModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileValues>({ resolver: zodResolver(updateProfileSchema) });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setError(null);
      reset({ name: currentName });
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, currentName, reset]);

  const onSubmit = async (values: UpdateProfileValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateStaffProfile(values);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onCancel}>
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Pencil className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">Edit name</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
          <FormTextField
            id="edit-name"
            label="Name"
            icon={User}
            registration={register("name")}
            error={errors.name?.message}
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
              {isSubmitting && <span className="loading loading-spinner loading-sm" />}
              Save
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
