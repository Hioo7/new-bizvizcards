import type { MigrationJob } from "../types";
import MigrationStatusBadge from "./MigrationStatusBadge";

interface MigrationJobRowProps {
  job: MigrationJob;
  isSelected: boolean;
  onSelect: () => void;
}

export default function MigrationJobRow({
  job,
  isSelected,
  onSelect,
}: MigrationJobRowProps) {
  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer border-b border-base-200 ${isSelected ? "bg-primary/5" : "hover:bg-base-200/50"}`}
    >
      <td className="py-2.5 pl-4 pr-3 whitespace-nowrap text-base-content/80">
        {new Date(job.createdAt).toLocaleString()}
      </td>
      <td className="px-3 py-2.5">
        <MigrationStatusBadge status={job.status} />
      </td>
      <td
        className="px-3 py-2.5 whitespace-nowrap text-base-content/80"
        title={`~${job.totalRecords} primary records estimated at start`}
      >
        {job.processedRecords} processed
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap text-success">
        {job.successCount}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap text-error">
        {job.rejectedCount}
      </td>
      <td className="py-2.5 pl-3 pr-4 whitespace-nowrap text-warning">
        {job.skippedCount}
      </td>
    </tr>
  );
}
