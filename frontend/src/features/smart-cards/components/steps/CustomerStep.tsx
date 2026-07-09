import { forwardRef, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomerPicker from "@features/smart-cards/components/CustomerPicker";
import { customerStepSchema } from "@features/smart-cards/schemas/smartCardStepSchemas";
import type {
  CustomerStepValues,
  SmartCardStepHandle,
} from "@features/smart-cards/types/smartCardForm.types";
import type { Customer } from "@app-types/customer";

interface CustomerStepProps {
  defaultValues: CustomerStepValues;
  initialSelectedCustomer?: Customer | null;
}

const CustomerStep = forwardRef<
  SmartCardStepHandle<CustomerStepValues>,
  CustomerStepProps
>(function CustomerStep({ defaultValues, initialSelectedCustomer = null }, ref) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    initialSelectedCustomer,
  );
  const {
    setValue,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useForm<CustomerStepValues>({
    resolver: zodResolver(customerStepSchema),
    defaultValues,
    mode: "onChange",
  });

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const valid = await trigger();
      return valid ? getValues() : null;
    },
    getDraft: () => getValues(),
  }));

  const customerId = watch("customerId");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-base-content/60">
        This template requires a linked customer account. Every visitor who
        exchanges contact details will be tied to this customer.
      </p>
      <CustomerPicker
        selectedCustomerId={customerId}
        selectedCustomer={selectedCustomer}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setValue("customerId", customer.id, { shouldValidate: true });
        }}
        error={errors.customerId?.message}
      />
    </div>
  );
});

export default CustomerStep;
