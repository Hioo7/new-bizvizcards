import type { BulkMessengerPolicy } from "@app-types/plan";

interface BulkMessengerPolicyFieldsProps {
  value: BulkMessengerPolicy;
  onChange: (value: BulkMessengerPolicy) => void;
}

export default function BulkMessengerPolicyFields({
  value,
  onChange,
}: BulkMessengerPolicyFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
        <span className="text-sm font-semibold text-base-content">
          Bulk Messenger available on this plan
        </span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={value.isAvailable}
          onChange={(event) =>
            onChange({ ...value, isAvailable: event.target.checked })
          }
        />
      </label>

      {value.isAvailable && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-base-content/60">
            Max message templates a customer can create
          </span>
          <input
            type="number"
            min={0}
            value={value.maxTemplates}
            onChange={(event) =>
              onChange({ ...value, maxTemplates: Number(event.target.value) })
            }
            className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
          />
        </label>
      )}
    </div>
  );
}
