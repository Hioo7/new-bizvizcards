import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import CustomerPickerField from "@components/CustomerPickerField";
import type { Customer } from "@app-types/customer";
import {
  createOrganisationSchema,
  type CreateOrganisationValues,
} from "@features/customer-organisation-management/schemas/createOrganisationSchema";

interface CreateOrganisationModalProps {
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: CreateOrganisationValues) => void;
}

export default function CreateOrganisationModal({
  open,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: CreateOrganisationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateOrganisationValues>({
    resolver: zodResolver(createOrganisationSchema),
    defaultValues: { name: "", customerId: "" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reset({ name: "", customerId: "" });
      setSelectedCustomer(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, reset]);

  const customerId = selectedCustomer?.id ?? "";

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onCancel}
    >
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">
            Add organisation
          </h3>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 flex flex-col gap-4"
        >
          <FormTextField
            id="organisation-name"
            label="Organisation name"
            icon={Building2}
            registration={register("name")}
            error={errors.name?.message}
          />

          <CustomerPickerField
            label="Founding SPOC"
            selectedCustomerId={customerId}
            selectedCustomer={selectedCustomer}
            onSelect={(customer) => {
              setSelectedCustomer(customer);
              setValue("customerId", customer.id, { shouldValidate: true });
            }}
            error={errors.customerId?.message}
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
              Add organisation
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
