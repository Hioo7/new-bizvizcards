import type { EventPolicy } from "@app-types/plan";

interface EventPolicyFieldsProps {
  value: EventPolicy;
  onChange: (value: EventPolicy) => void;
}

export default function EventPolicyFields({
  value,
  onChange,
}: EventPolicyFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
        <span className="text-sm font-semibold text-base-content">
          Business events available on this plan
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
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-base-content/60">
              Max events a customer can host
            </span>
            <input
              type="number"
              min={0}
              value={value.maxEvents}
              onChange={(event) =>
                onChange({ ...value, maxEvents: Number(event.target.value) })
              }
              className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-base-content/60">
              Max guests per event
            </span>
            <input
              type="number"
              min={0}
              value={value.maxGuestsPerEvent}
              onChange={(event) =>
                onChange({
                  ...value,
                  maxGuestsPerEvent: Number(event.target.value),
                })
              }
              className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
            />
          </label>
        </>
      )}
    </div>
  );
}
