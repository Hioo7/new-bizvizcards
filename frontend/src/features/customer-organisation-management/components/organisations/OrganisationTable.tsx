import { Building2 } from "lucide-react";
import type { OrganisationSummary } from "@app-types/organisation";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import OrganisationRow from "@features/customer-organisation-management/components/organisations/OrganisationRow";
import OrganisationCard from "@features/customer-organisation-management/components/organisations/OrganisationCard";

interface OrganisationTableProps {
  organisations: OrganisationSummary[];
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onOpen: (organisation: OrganisationSummary) => void;
}

export default function OrganisationTable({
  organisations,
  isLoading,
  error,
  hasActiveFilters,
  onOpen,
}: OrganisationTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return <FormErrorRibbon message={error} />;
  }

  if (organisations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Building2 className="h-8 w-8 text-base-content/30" />
        <p className="text-sm text-base-content/60">
          {hasActiveFilters
            ? "No organisations match your search."
            : "No organisations yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <tbody>
          {organisations.map((organisation) => (
            <OrganisationRow
              key={organisation.id}
              organisation={organisation}
              onOpen={() => onOpen(organisation)}
            />
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {organisations.map((organisation) => (
          <OrganisationCard
            key={organisation.id}
            organisation={organisation}
            onOpen={() => onOpen(organisation)}
          />
        ))}
      </div>
    </>
  );
}
