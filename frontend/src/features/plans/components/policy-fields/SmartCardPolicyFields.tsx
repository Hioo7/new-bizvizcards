import type { SmartCardPolicy } from "@app-types/plan";
import SmartCardTemplateWhitelistPicker from "@features/plans/components/policy-fields/SmartCardTemplateWhitelistPicker";

interface SmartCardPolicyFieldsProps {
  value: SmartCardPolicy;
  onChange: (value: SmartCardPolicy) => void;
}

export default function SmartCardPolicyFields({
  value,
  onChange,
}: SmartCardPolicyFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
        <span className="text-sm font-semibold text-base-content">
          Smart cards available on this plan
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
              Max smart cards per customer
            </span>
            <input
              type="number"
              min={0}
              value={value.maxSmartCards}
              onChange={(event) =>
                onChange({
                  ...value,
                  maxSmartCards: Number(event.target.value),
                })
              }
              className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
            />
          </label>

          <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
            <span className="text-sm font-medium text-base-content">
              Exchange contact
            </span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={value.exchangeContactAccess}
              onChange={(event) =>
                onChange({
                  ...value,
                  exchangeContactAccess: event.target.checked,
                })
              }
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Whitelisted templates{" "}
              <span className="normal-case text-base-content/40">
                (none selected = no templates allowed)
              </span>
            </p>
            <SmartCardTemplateWhitelistPicker
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
