import { useEffect, useRef, useState } from "react";
import { UserCheck } from "lucide-react";
import BulkCustomerPickerField from "@components/BulkCustomerPickerField";
import type { Customer } from "@app-types/customer";

interface LinkExistingInviteMemberModalProps {
  open: boolean;
  inviteEmail: string;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (customerId: string) => void;
}

export default function LinkExistingInviteMemberModal({
  open,
  inviteEmail,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: LinkExistingInviteMemberModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Customer[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setSelected([]);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleSelectionChange(customers: Customer[]) {
    // Single-select for this use case — one invite resolves to one account.
    setSelected(customers.slice(-1));
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
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-base-content">
              Link existing account
            </h3>
            <p className="text-xs text-base-content/50">
              Resolving the invite for {inviteEmail}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <BulkCustomerPickerField
            label="Customer to link"
            selectedCustomers={selected}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

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
            type="button"
            onClick={() => selected[0] && onSubmit(selected[0].id)}
            disabled={isSubmitting || selected.length === 0}
            className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
          >
            {isSubmitting && (
              <span className="loading loading-spinner loading-sm" />
            )}
            Link account
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
