import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Printer } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import {
  unitQuantitySchema,
  type UnitQuantityValues,
} from "@features/product-management/schemas/unitQuantitySchema";

interface CreatePrintBatchFormProps {
  maxQuantity: number;
  /** Called with the validated quantity — the caller confirms before actually creating the batch. */
  onRequestPrintBatch: (quantity: number) => void;
}

export default function CreatePrintBatchForm({
  maxQuantity,
  onRequestPrintBatch,
}: CreatePrintBatchFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnitQuantityValues>({
    resolver: zodResolver(unitQuantitySchema),
    defaultValues: { quantity: Math.min(50, maxQuantity) || 1 },
  });

  if (maxQuantity <= 0) {
    return (
      <p className="text-xs text-base-content/50">
        No unprinted units available — generate more units first.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => onRequestPrintBatch(values.quantity))}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <FormTextField
          id="print-batch-quantity"
          label={`Quantity to send to print (max ${maxQuantity})`}
          icon={Printer}
          type="number"
          min={1}
          max={maxQuantity}
          registration={register("quantity", { valueAsNumber: true })}
          error={errors.quantity?.message}
        />
      </div>
      <button
        type="submit"
        aria-label="Send to manufacturer"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-content hover:bg-secondary/90"
      >
        <Printer className="h-5 w-5" />
      </button>
    </form>
  );
}
