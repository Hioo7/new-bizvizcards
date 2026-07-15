import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User, UserPlus } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import PasswordField from "@components/forms/PasswordField";
import {
  createCustomerSchema,
  type CreateCustomerValues,
} from "@features/customer-organisation-management/schemas/createCustomerSchema";

interface CreateCustomerModalProps {
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: CreateCustomerValues) => void;
}

const DEFAULT_VALUES: CreateCustomerValues = {
  name: "",
  email: "",
  password: "",
};

export default function CreateCustomerModal({
  open,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: CreateCustomerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [stage, setStage] = useState<1 | 2>(1);
  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reset(DEFAULT_VALUES);
      setStage(1);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, reset]);

  const handleNext = async () => {
    const valid = await trigger(["name", "email"]);
    if (valid) setStage(2);
  };

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
          <h3 className="text-lg font-bold text-base-content">
            Add customer
          </h3>
        </div>

        <div className="mt-4 flex gap-1.5">
          <span
            className={`h-1 flex-1 rounded-full ${stage >= 1 ? "bg-primary" : "bg-base-300"}`}
          />
          <span
            className={`h-1 flex-1 rounded-full ${stage >= 2 ? "bg-primary" : "bg-base-300"}`}
          />
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 flex flex-col gap-4"
        >
          {stage === 1 && (
            <>
              <FormTextField
                id="customer-name"
                label="Name"
                icon={User}
                registration={register("name")}
                error={errors.name?.message}
              />
              <FormTextField
                id="customer-email"
                label="Email"
                icon={Mail}
                type="email"
                registration={register("email")}
                error={errors.email?.message}
              />

              <div className="modal-action">
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleNext()}
                  className="btn min-h-11 rounded-field bg-primary text-primary-content hover:bg-primary/90"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {stage === 2 && (
            <>
              <PasswordField
                id="customer-password"
                label="Password"
                registration={register("password")}
                error={errors.password?.message}
              />

              {error && <p className="text-sm text-error">{error}</p>}

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setStage(1)}
                  disabled={isSubmitting}
                  className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
                >
                  {isSubmitting && (
                    <span className="loading loading-spinner loading-sm" />
                  )}
                  Add customer
                </button>
              </div>
            </>
          )}
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
