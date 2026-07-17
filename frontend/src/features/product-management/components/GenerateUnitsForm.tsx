import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, PlusCircle } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import {
  unitQuantitySchema,
  type UnitQuantityValues,
} from "@features/product-management/schemas/unitQuantitySchema";

interface GenerateUnitsFormProps {
  /** Called with the validated quantity — the caller confirms before actually generating. */
  onRequestGenerate: (quantity: number) => void;
}

export default function GenerateUnitsForm({
  onRequestGenerate,
}: GenerateUnitsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnitQuantityValues>({
    resolver: zodResolver(unitQuantitySchema),
    defaultValues: { quantity: 50 },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onRequestGenerate(values.quantity))}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <FormTextField
          id="generate-units-quantity"
          label="Quantity to generate"
          icon={PlusCircle}
          type="number"
          min={1}
          registration={register("quantity", { valueAsNumber: true })}
          error={errors.quantity?.message}
        />
      </div>
      <button
        type="submit"
        aria-label="Generate units"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
      >
        <Plus className="h-5 w-5" />
      </button>
    </form>
  );
}
