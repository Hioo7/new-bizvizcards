import type { CreatePlanPayload } from "@app-types/plan";
import { ECARD_COMPONENT_LABELS } from "@features/plans/config";

interface PlanReviewStepProps {
  value: CreatePlanPayload;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-base-content/60">{label}</span>
      <span className="font-medium text-base-content">{value}</span>
    </div>
  );
}

export default function PlanReviewStep({ value }: PlanReviewStepProps) {
  const availableComponents = value.ecardPolicy.componentAvailabilities
    .filter((component) => component.isAvailable)
    .map((component) => ECARD_COMPONENT_LABELS[component.type]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-box border border-base-300 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Basics
        </p>
        <SummaryRow label="Name" value={value.name || "—"} />
        <SummaryRow label="Price" value={`₹${value.price}`} />
        <SummaryRow label="Business model" value={value.businessModelType} />
        {value.businessModelType === "SUBSCRIPTION" && (
          <SummaryRow
            label="Duration"
            value={`${value.subscriptionDurationMonths ?? "—"} months`}
          />
        )}
      </div>

      <div className="rounded-box border border-base-300 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          E-card policy
        </p>
        <SummaryRow
          label="Available"
          value={value.ecardPolicy.isAvailable ? "Yes" : "No"}
        />
        {value.ecardPolicy.isAvailable && (
          <>
            <SummaryRow label="Max e-cards" value={String(value.ecardPolicy.maxEcards)} />
            <SummaryRow
              label="Exchange contact"
              value={value.ecardPolicy.exchangeContactAccess ? "Yes" : "No"}
            />
            <SummaryRow
              label="Components"
              value={availableComponents.length > 0 ? availableComponents.join(", ") : "None"}
            />
          </>
        )}
      </div>

      <div className="rounded-box border border-base-300 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Smart card policy
        </p>
        <SummaryRow
          label="Available"
          value={value.smartCardPolicy.isAvailable ? "Yes" : "No"}
        />
        {value.smartCardPolicy.isAvailable && (
          <>
            <SummaryRow
              label="Max smart cards"
              value={String(value.smartCardPolicy.maxSmartCards)}
            />
            <SummaryRow
              label="Whitelisted templates"
              value={String(value.smartCardPolicy.whitelistedTemplateIds.length)}
            />
          </>
        )}
      </div>

      <div className="rounded-box border border-base-300 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Organisation policy
        </p>
        <SummaryRow
          label="Available"
          value={value.organisationPolicy.isAvailable ? "Yes" : "No"}
        />
        {value.organisationPolicy.isAvailable && (
          <>
            <SummaryRow
              label="Max joinable"
              value={String(value.organisationPolicy.maxOrgsCanJoin)}
            />
            <SummaryRow
              label="Max creatable"
              value={String(value.organisationPolicy.maxOrgsCanCreate)}
            />
          </>
        )}
      </div>

      <div className="rounded-box border border-base-300 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Event policy
        </p>
        <SummaryRow
          label="Available"
          value={value.eventPolicy.isAvailable ? "Yes" : "No"}
        />
        {value.eventPolicy.isAvailable && (
          <>
            <SummaryRow
              label="Max events per host"
              value={String(value.eventPolicy.maxEvents)}
            />
            <SummaryRow
              label="Max guests per event"
              value={String(value.eventPolicy.maxGuestsPerEvent)}
            />
          </>
        )}
      </div>
    </div>
  );
}
