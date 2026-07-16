import { Tag } from "lucide-react";
import type { CreatePlanPayload } from "@app-types/plan";
import {
  PLAN_NAME_MAX_LENGTH,
  PLAN_PRICE_MAX,
  PLAN_SUBSCRIPTION_DURATION_MAX_MONTHS,
  PLAN_SUBSCRIPTION_DURATION_MIN_MONTHS,
} from "@features/plans/config";

interface PlanBasicsStepProps {
  value: CreatePlanPayload;
  onChange: (value: CreatePlanPayload) => void;
}

export default function PlanBasicsStep({
  value,
  onChange,
}: PlanBasicsStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Plan name
        </span>
        <div className="relative">
          <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            maxLength={PLAN_NAME_MAX_LENGTH}
            value={value.name}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 py-2.5 pl-10 pr-4 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
          />
        </div>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Price
        </span>
        <input
          type="number"
          min={0}
          max={PLAN_PRICE_MAX}
          value={value.price}
          onChange={(event) =>
            onChange({ ...value, price: Number(event.target.value) })
          }
          className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
        <span className="text-xs text-base-content/40">
          Inert this pass — stored for a future public checkout flow.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Business model
        </span>
        <select
          value={value.businessModelType}
          onChange={(event) =>
            onChange({
              ...value,
              businessModelType: event.target
                .value as CreatePlanPayload["businessModelType"],
              subscriptionDurationMonths:
                event.target.value === "SUBSCRIPTION"
                  ? (value.subscriptionDurationMonths ??
                    PLAN_SUBSCRIPTION_DURATION_MIN_MONTHS)
                  : undefined,
            })
          }
          className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        >
          <option value="ONE_TIME">One-time purchase</option>
          <option value="SUBSCRIPTION">Subscription</option>
          <option value="TRIAL">Trial (free, once per customer)</option>
        </select>
      </label>

      {value.businessModelType === "SUBSCRIPTION" && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-base-content/60">
            Subscription duration (months)
          </span>
          <input
            type="number"
            min={PLAN_SUBSCRIPTION_DURATION_MIN_MONTHS}
            max={PLAN_SUBSCRIPTION_DURATION_MAX_MONTHS}
            value={value.subscriptionDurationMonths ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                subscriptionDurationMonths: Number(event.target.value),
              })
            }
            className="min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
          />
        </label>
      )}

      <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2">
        <span className="text-sm font-medium text-base-content">
          Public
          <span className="ml-1 font-normal text-base-content/40">
            (inert this pass — employee-assigned only)
          </span>
        </span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={value.isPublic}
          onChange={(event) =>
            onChange({ ...value, isPublic: event.target.checked })
          }
        />
      </label>
    </div>
  );
}
