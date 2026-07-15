import { Building2, ChevronRight } from "lucide-react";
import type { OrganisationSummary } from "@app-types/organisation";

interface OrganisationCardProps {
  organisation: OrganisationSummary;
  onOpen: () => void;
}

export default function OrganisationCard({
  organisation,
  onOpen,
}: OrganisationCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 p-4 text-left"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-300 text-base-content/60">
        {organisation.logoUrl ? (
          <img
            src={organisation.logoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Building2 className="h-4 w-4" />
        )}
      </span>
      <p className="flex-1 font-semibold text-base-content">
        {organisation.name}
      </p>
      <ChevronRight className="h-4 w-4 shrink-0 text-base-content/40" />
    </button>
  );
}
