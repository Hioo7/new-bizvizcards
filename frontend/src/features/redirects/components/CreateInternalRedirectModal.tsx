import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft, MoveRight } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import {
  internalRedirectSchema,
  type InternalRedirectValues,
} from "@features/redirects/schemas/internalRedirectSchema";

interface CreateInternalRedirectModalProps {
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: InternalRedirectValues) => void;
}

export default function CreateInternalRedirectModal({
  open,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: CreateInternalRedirectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InternalRedirectValues>({
    resolver: zodResolver(internalRedirectSchema),
    defaultValues: { sourcePath: "", targetPath: "" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reset({ sourcePath: "", targetPath: "" });
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
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">
            Add internal redirect
          </h3>
        </div>
        <p className="mt-3 text-sm text-base-content/60">
          Requests to the source path are redirected to the target path
          within the app.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 flex flex-col gap-4"
        >
          <FormTextField
            id="internal-redirect-source"
            label="Source path"
            icon={MoveRight}
            placeholder="/old-page"
            registration={register("sourcePath")}
            error={errors.sourcePath?.message}
          />
          <FormTextField
            id="internal-redirect-target"
            label="Target path"
            icon={MoveRight}
            placeholder="/new-page"
            registration={register("targetPath")}
            error={errors.targetPath?.message}
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
              Add redirect
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
