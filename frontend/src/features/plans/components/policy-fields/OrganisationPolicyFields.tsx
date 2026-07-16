import type { OrganisationPolicy } from "@app-types/plan";
import EcardPolicyFields from "@features/plans/components/policy-fields/EcardPolicyFields";
import SmartCardPolicyFields from "@features/plans/components/policy-fields/SmartCardPolicyFields";

interface OrganisationPolicyFieldsProps {
  value: OrganisationPolicy;
  onChange: (value: OrganisationPolicy) => void;
}

export default function OrganisationPolicyFields({
  value,
  onChange,
}: OrganisationPolicyFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
        <span className="text-sm font-semibold text-base-content">
          Organisations available on this plan
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-base-content/60">
                Max organisations this customer can join
              </span>
              <input
                type="number"
                min={0}
                value={value.maxOrgsCanJoin}
                onChange={(event) =>
                  onChange({
                    ...value,
                    maxOrgsCanJoin: Number(event.target.value),
                  })
                }
                className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-base-content/60">
                Max organisations this customer can create
              </span>
              <input
                type="number"
                min={0}
                value={value.maxOrgsCanCreate}
                onChange={(event) =>
                  onChange({
                    ...value,
                    maxOrgsCanCreate: Number(event.target.value),
                  })
                }
                className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
              />
            </label>
          </div>

          <div className="rounded-box border border-base-300 p-4">
            <p className="mb-3 text-sm font-semibold text-base-content">
              Organisation e-card boost
            </p>
            <p className="mb-3 text-xs text-base-content/60">
              Applies to every e-card linked to an organisation this customer
              created, on top of each member&apos;s own personal plan —
              additive only, never revokes what a member&apos;s plan already
              grants.
            </p>
            <EcardPolicyFields
              value={value.orgEcardPolicy}
              onChange={(orgEcardPolicy) =>
                onChange({ ...value, orgEcardPolicy })
              }
            />
          </div>

          <div className="rounded-box border border-base-300 p-4">
            <p className="mb-3 text-sm font-semibold text-base-content">
              Organisation smart-card boost
            </p>
            <SmartCardPolicyFields
              value={value.orgSmartCardPolicy}
              onChange={(orgSmartCardPolicy) =>
                onChange({ ...value, orgSmartCardPolicy })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
