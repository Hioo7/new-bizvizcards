import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IndianRupee, PackagePlus } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import FormTextareaField from "@components/forms/FormTextareaField";
import {
  createProductSchema,
  type CreateProductValues,
} from "@features/product-management/schemas/createProductSchema";
import { PRODUCT_TYPE_OPTIONS } from "@features/product-management/config/productManagement.config";

interface CreateProductModalProps {
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: CreateProductValues) => void;
}

const DEFAULT_VALUES: CreateProductValues = {
  name: "",
  description: "",
  productType: "STANDALONE",
  price: undefined,
};

export default function CreateProductModal({
  open,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: CreateProductModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateProductValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const productType = useWatch({ control, name: "productType" });

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
            <PackagePlus className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">Add product</h3>
        </div>

        <form
          onSubmit={handleSubmit((values) =>
            onSubmit(
              productType === "STANDALONE" ? values : { ...values, price: undefined },
            ),
          )}
          className="mt-4 flex flex-col gap-4"
        >
          <FormTextField
            id="product-name"
            label="Name"
            icon={PackagePlus}
            registration={register("name")}
            error={errors.name?.message}
          />
          <FormTextareaField
            id="product-description"
            label="Description (optional)"
            registration={register("description")}
            error={errors.description?.message}
          />

          <div>
            <p className="mb-1.5 text-xs font-semibold text-base-content/70">
              Product structure
            </p>
            <div className="flex flex-col gap-2">
              {PRODUCT_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-field border border-base-300 px-3 py-3 text-sm transition has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    value={option.value}
                    {...register("productType")}
                    className="radio radio-primary radio-sm"
                  />
                  <span className="text-base-content">{option.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-base-content/50">
              This can&apos;t be changed after the product is created.
            </p>
          </div>

          {productType === "STANDALONE" && (
            <FormTextField
              id="product-price"
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
              Add product
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
