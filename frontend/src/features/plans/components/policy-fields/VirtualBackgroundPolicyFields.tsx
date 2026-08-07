import type { VirtualBackgroundPolicy } from "@app-types/plan";
import VirtualBackgroundTemplateWhitelistPicker from "@features/plans/components/policy-fields/VirtualBackgroundTemplateWhitelistPicker";

interface VirtualBackgroundPolicyFieldsProps {
  value: VirtualBackgroundPolicy;
  onChange: (value: VirtualBackgroundPolicy) => void;
}

export default function VirtualBackgroundPolicyFields({
  value,
  onChange,
}: VirtualBackgroundPolicyFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
        <span className="text-sm font-semibold text-base-content">
          Virtual backgrounds available on this plan
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
              Max virtual backgrounds a customer can save
            </span>
            <input
              type="number"
              min={0}
              value={value.maxVirtualBackgrounds}
              onChange={(event) =>
                onChange({
                  ...value,
                  maxVirtualBackgrounds: Number(event.target.value),
                })
              }
              className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
            />
          </label>

          <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
            <span className="text-sm font-medium text-base-content">
              Allow uploading a custom base image
            </span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={value.allowCustomBackground}
              onChange={(event) =>
                onChange({
                  ...value,
                  allowCustomBackground: event.target.checked,
                })
              }
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Whitelisted preset templates{" "}
              <span className="normal-case text-base-content/40">
                (none selected = no presets offered)
              </span>
            </p>
            <VirtualBackgroundTemplateWhitelistPicker
              value={value.whitelistedTemplateIds}
              onChange={(whitelistedTemplateIds) =>
                onChange({ ...value, whitelistedTemplateIds })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
