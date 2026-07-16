import CustomerPickerField from "@components/CustomerPickerField";
import type { Customer } from "@app-types/customer";

interface EventHostStepProps {
  selectedCustomerId: string;
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
}

export default function EventHostStep({
  selectedCustomerId,
  selectedCustomer,
  onSelect,
}: EventHostStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-base-content/60">
        Choose the customer who will host this event. They become the
        event's host with full control over co-hosts, volunteers, the guest
        list, and trackables.
      </p>
      <CustomerPickerField
        label="Event host"
        selectedCustomerId={selectedCustomerId}
        selectedCustomer={selectedCustomer}
        onSelect={onSelect}
      />
    </div>
  );
}
