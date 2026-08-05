import type { EcardPolicy } from "@app-types/plan";
import EcardComponentAvailabilityFields from "@features/plans/components/policy-fields/EcardComponentAvailabilityFields";
import HeroLayoutAvailabilityFields from "@features/plans/components/policy-fields/HeroLayoutAvailabilityFields";
import EcardThemeAvailabilityFields from "@features/plans/components/policy-fields/EcardThemeAvailabilityFields";
import EcardIconShapeAvailabilityFields from "@features/plans/components/policy-fields/EcardIconShapeAvailabilityFields";
import EcardAccentColorPresetsFields from "@features/plans/components/policy-fields/EcardAccentColorPresetsFields";

interface EcardPolicyFieldsProps {
  value: EcardPolicy;
  onChange: (value: EcardPolicy) => void;
}

export default function EcardPolicyFields({
  value,
  onChange,
}: EcardPolicyFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
        <span className="text-sm font-semibold text-base-content">
          E-cards available on this plan
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
              Max e-cards per customer
            </span>
            <input
              type="number"
              min={0}
              value={value.maxEcards}
              onChange={(event) =>
                onChange({ ...value, maxEcards: Number(event.target.value) })
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
              onChange={(event) => {
                const exchangeContactAccess = event.target.checked;
                onChange({
                  ...value,
                  exchangeContactAccess,
                  // Customizable forms are pointless without base exchange
                  // contact — nothing would ever render/resolve one — so
                  // turning this off always turns that off too.
                  isCustomFormAvailable: exchangeContactAccess
                    ? value.isCustomFormAvailable
                    : false,
                });
              }}
            />
          </label>

          {value.exchangeContactAccess && (
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
              <span className="text-sm font-medium text-base-content">
                Customizable exchange contact forms
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={value.isCustomFormAvailable}
                onChange={(event) =>
                  onChange({
                    ...value,
                    isCustomFormAvailable: event.target.checked,
                  })
                }
              />
            </label>
          )}

          {value.exchangeContactAccess && value.isCustomFormAvailable && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-base-content/60">
                Max custom forms per customer
              </span>
              <input
                type="number"
                min={0}
                value={value.maxCustomForms}
                onChange={(event) =>
                  onChange({
                    ...value,
                    maxCustomForms: Number(event.target.value),
                  })
                }
                className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
              />
            </label>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Components
            </p>
            <EcardComponentAvailabilityFields
              value={value.componentAvailabilities}
              onChange={(componentAvailabilities) =>
                onChange({ ...value, componentAvailabilities })
              }
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Hero layouts
            </p>
            <HeroLayoutAvailabilityFields
              value={value.heroLayoutAvailabilities}
              onChange={(heroLayoutAvailabilities) =>
                onChange({ ...value, heroLayoutAvailabilities })
              }
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Themes
            </p>
            <EcardThemeAvailabilityFields
              value={value.themeAvailabilities}
              onChange={(themeAvailabilities) =>
                onChange({ ...value, themeAvailabilities })
              }
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Icon shapes
            </p>
            <EcardIconShapeAvailabilityFields
              value={value.iconShapeAvailabilities}
              onChange={(iconShapeAvailabilities) =>
                onChange({ ...value, iconShapeAvailabilities })
              }
            />
          </div>

          <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
            <span className="text-sm font-medium text-base-content">
              Custom accent colors
            </span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={value.accentColorCustomizationAvailable}
              onChange={(event) =>
                onChange({
                  ...value,
                  accentColorCustomizationAvailable: event.target.checked,
                })
              }
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Accent color presets
            </p>
            <EcardAccentColorPresetsFields
              value={value.accentColorPresets}
              onChange={(accentColorPresets) =>
                onChange({ ...value, accentColorPresets })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
