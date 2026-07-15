import { Building2, ChevronRight } from "lucide-react";
import type { OrganisationSummary } from "@app-types/organisation";

interface OrganisationRowProps {
  organisation: OrganisationSummary;
  onOpen: () => void;
}

export default function OrganisationRow({
  organisation,
  onOpen,
}: OrganisationRowProps) {
  return (
    <tr
      className="cursor-pointer border-b border-base-300 last:border-b-0 hover:bg-base-200/50"
      onClick={onOpen}
    >
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
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
          <p className="font-semibold text-base-content">
            {organisation.name}
          </p>
        </div>
      </td>
      <td className="py-3 pl-3 pr-4 text-right">
        <ChevronRight className="ml-auto h-4 w-4 text-base-content/40" />
      </td>
    </tr>
  );
}
