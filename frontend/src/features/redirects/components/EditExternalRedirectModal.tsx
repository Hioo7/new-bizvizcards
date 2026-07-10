import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, MoveRight, Pencil } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import {
  externalRedirectSchema,
  type ExternalRedirectValues,
} from "@features/redirects/schemas/externalRedirectSchema";
import type { ExternalRedirect } from "@features/redirects/types/redirects.types";

interface EditExternalRedirectModalProps {
  open: boolean;
  redirect: ExternalRedirect | null;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: ExternalRedirectValues) => void;
}

export default function EditExternalRedirectModal({
  open,
  redirect,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: EditExternalRedirectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExternalRedirectValues>({
    resolver: zodResolver(externalRedirectSchema),
    defaultValues: { sourcePath: "", destinationUrl: "" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && redirect && !dialog.open) {
      reset({
        sourcePath: redirect.sourcePath,
        destinationUrl: redirect.destinationUrl,
      });
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, redirect, reset]);

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
            Edit external redirect
          </h3>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 flex flex-col gap-4"
        >
          <FormTextField
            id="edit-external-redirect-source"
            label="Source path"
            icon={MoveRight}
            registration={register("sourcePath")}
            error={errors.sourcePath?.message}
          />
          <FormTextField
            id="edit-external-redirect-destination"
            label="Destination URL"
            icon={Link2}
            registration={register("destinationUrl")}
            error={errors.destinationUrl?.message}
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
