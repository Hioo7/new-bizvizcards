import { useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import CustomerPickerField from "@components/CustomerPickerField";
import type { Customer } from "@app-types/customer";
import type { AssignableEventMemberRole } from "@app-types/businessEvent";

interface AddEventMemberModalProps {
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (customerId: string, role: AssignableEventMemberRole) => void;
}

export default function AddEventMemberModal({
  open,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: AddEventMemberModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [role, setRole] = useState<AssignableEventMemberRole>("VOLUNTEER");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setSelectedCustomer(null);
      setRole("VOLUNTEER");
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCustomer) return;
    onSubmit(selectedCustomer.id, role);
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
          <h3 className="text-lg font-bold text-base-content">Add member</h3>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <CustomerPickerField
            label="Customer"
            selectedCustomerId={selectedCustomer?.id ?? ""}
            selectedCustomer={selectedCustomer}
            onSelect={setSelectedCustomer}
          />

          <div>
            <label
              htmlFor="add-event-member-role"
              className="mb-1.5 block text-xs font-semibold text-base-content/70"
            >
              Add as
            </label>
            <select
              id="add-event-member-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as AssignableEventMemberRole)
              }
              className="w-full min-h-11 rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
            >
              <option value="CO_HOST">Co-Host</option>
              <option value="VOLUNTEER">Volunteer</option>
            </select>
          </div>

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
              disabled={isSubmitting || !selectedCustomer}
              className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
            >
              {isSubmitting && (
                <span className="loading loading-spinner loading-sm" />
              )}
              Add member
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
