import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IndianRupee, Pencil } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import FormTextareaField from "@components/forms/FormTextareaField";
import type { Product } from "@app-types/product.types";
import {
  editProductSchema,
  type EditProductValues,
} from "@features/product-management/schemas/editProductSchema";

interface EditProductModalProps {
  open: boolean;
  product: Product | null;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: EditProductValues) => void;
}

export default function EditProductModal({
  open,
  product,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: EditProductModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProductValues>({
    resolver: zodResolver(editProductSchema),
    defaultValues: { name: "", description: "", price: undefined },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && product && !dialog.open) {
      reset({
        name: product.name,
        description: product.description ?? "",
        price: product.price ?? undefined,
      });
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, product, reset]);

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onCancel}>
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Pencil className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">Edit product</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
          <FormTextField
            id="edit-product-name"
            label="Name"
            icon={Pencil}
            registration={register("name")}
            error={errors.name?.message}
          />
          <FormTextareaField
            id="edit-product-description"
            label="Description (optional)"
            registration={register("description")}
            error={errors.description?.message}
          />
          {product?.productType === "STANDALONE" && (
            <FormTextField
              id="edit-product-price"
              label="Price"
              icon={IndianRupee}
              type="number"
              step="0.01"
              min={0}
              registration={register("price", { valueAsNumber: true })}
              error={errors.price?.message}
            />
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
