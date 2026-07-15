import { Ban, CircleCheck, Contact, KeyRound, Pencil, User } from "lucide-react";
import type { Customer } from "@app-types/customer";
import BannedStatusBadge from "@components/BannedStatusBadge";

interface CustomerRowProps {
  customer: Customer;
  canBan: boolean;
  onEdit: () => void;
  onSetPassword: () => void;
  onBanToggle: () => void;
  onManageEcards: () => void;
}

export default function CustomerRow({
  customer,
  canBan,
  onEdit,
  onSetPassword,
  onBanToggle,
  onManageEcards,
}: CustomerRowProps) {
  return (
    <tr className="border-b border-base-300 last:border-b-0 hover:bg-base-200/50">
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-300 text-base-content/60">
            {customer.pfpUrl ? (
              <img
                src={customer.pfpUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
          </span>
          <div>
            <p className="font-semibold text-base-content">{customer.name}</p>
            <p className="text-xs text-base-content/60">{customer.email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <BannedStatusBadge banned={customer.banned} />
      </td>
      <td className="py-3 pl-3 pr-4">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label={`Manage e-cards for ${customer.name}`}
            onClick={onManageEcards}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-secondary"
          >
            <Contact className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Edit ${customer.name}`}
            onClick={onEdit}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Set password for ${customer.name}`}
            onClick={onSetPassword}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          {canBan && (
            <button
              type="button"
              aria-label={
                customer.banned ? `Unban ${customer.name}` : `Ban ${customer.name}`
              }
              onClick={onBanToggle}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-warning"
            >
              {customer.banned ? (
                <CircleCheck className="h-4 w-4" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
