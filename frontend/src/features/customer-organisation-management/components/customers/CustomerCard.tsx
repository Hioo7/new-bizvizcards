import { Ban, CircleCheck, Contact, KeyRound, Pencil, User } from "lucide-react";
import type { Customer } from "@app-types/customer";
import BannedStatusBadge from "@components/BannedStatusBadge";

interface CustomerCardProps {
  customer: Customer;
  canBan: boolean;
  onEdit: () => void;
  onSetPassword: () => void;
  onBanToggle: () => void;
  onManageEcards: () => void;
}

export default function CustomerCard({
  customer,
  canBan,
  onEdit,
  onSetPassword,
  onBanToggle,
  onManageEcards,
}: CustomerCardProps) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4">
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

      <div className="mt-3">
        <BannedStatusBadge banned={customer.banned} />
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-base-300 pt-3">
        <button
          type="button"
          onClick={onManageEcards}
          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-field border border-base-300 text-sm text-base-content/70"
        >
          <Contact className="h-4 w-4" />
          E-cards
        </button>
        <button
          type="button"
          aria-label={`Edit ${customer.name}`}
          onClick={onEdit}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-field border border-base-300 text-base-content/70"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Set password for ${customer.name}`}
          onClick={onSetPassword}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-field border border-base-300 text-base-content/70"
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
            className="flex min-h-11 min-w-11 items-center justify-center rounded-field border border-base-300 text-base-content/70"
          >
            {customer.banned ? (
              <CircleCheck className="h-4 w-4" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
