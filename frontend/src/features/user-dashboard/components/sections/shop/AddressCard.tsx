import type { Address } from "@features/user-dashboard/types";

interface AddressCardProps {
  address: Address;
  selected: boolean;
  onSelect: () => void;
}

export default function AddressCard({
  address,
  selected,
  onSelect,
}: AddressCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border p-4 transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-base-300 bg-base-100 hover:bg-base-200"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Selection indicator */}
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selected ? "border-primary bg-primary" : "border-base-300"
          }`}
        >
          {selected && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-3 w-3"
              aria-hidden="true"
            >
              <path
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Address info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-base-content">
              {address.label}
            </p>
            {address.isDefault && (
              <span className="badge badge-primary badge-xs">Default</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-base-content/60">
            {address.contactName}
          </p>
          <p className="mt-1 text-xs text-base-content/70 leading-relaxed">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            {", "}
            {address.city}, {address.state} {address.pincode}
          </p>
          <p className="mt-0.5 text-xs text-base-content/50">
            {address.contactPhoneCountryDialCode} {address.contactPhoneNumber}
          </p>
        </div>
      </div>
    </button>
  );
}
