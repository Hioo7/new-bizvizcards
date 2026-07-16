import { useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import BulkCustomerPickerField from "@components/BulkCustomerPickerField";
import type { Customer } from "@app-types/customer";

interface BulkAddEventGuestsModalProps {
  open: boolean;
  excludeCustomerIds: string[];
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (customerIds: string[]) => void;
}

export default function BulkAddEventGuestsModal({
  open,
  excludeCustomerIds,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: BulkAddEventGuestsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setSelectedCustomers([]);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (selectedCustomers.length === 0) return;
    onSubmit(selectedCustomers.map((c) => c.id));
  }

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
          <h3 className="text-lg font-bold text-base-content">Add guests</h3>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <BulkCustomerPickerField
            label="Guests"
            selectedCustomers={selectedCustomers}
            onSelectionChange={setSelectedCustomers}
            excludeCustomerIds={excludeCustomerIds}
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
              disabled={isSubmitting || selectedCustomers.length === 0}
              className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
            >
              {isSubmitting && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {selectedCustomers.length > 0
                ? `Add ${selectedCustomers.length} ${selectedCustomers.length === 1 ? "guest" : "guests"}`
                : "Add guests"}
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
