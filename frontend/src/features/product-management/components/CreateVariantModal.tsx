import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IndianRupee, Layers, Tag } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import {
  productVariantSchema,
  type ProductVariantValues,
} from "@features/product-management/schemas/productVariantSchema";

interface CreateVariantModalProps {
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: ProductVariantValues) => void;
}

const DEFAULT_VALUES: ProductVariantValues = {
  name: "",
  sku: "",
  price: 0,
};

export default function CreateVariantModal({
  open,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: CreateVariantModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductVariantValues>({
    resolver: zodResolver(productVariantSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reset(DEFAULT_VALUES);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, reset]);

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onCancel}>
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">Add variant</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
          <FormTextField
            id="variant-name"
            label="Name (e.g. Black / Large)"
            icon={Layers}
            registration={register("name")}
            error={errors.name?.message}
          />
          <FormTextField
            id="variant-sku"
            label="SKU"
            icon={Tag}
            registration={register("sku")}
            error={errors.sku?.message}
          />
          <FormTextField
            id="variant-price"
            label="Price"
            icon={IndianRupee}
            type="number"
            step="0.01"
            min={0}
            registration={register("price", { valueAsNumber: true })}
            error={errors.price?.message}
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
              Add variant
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
