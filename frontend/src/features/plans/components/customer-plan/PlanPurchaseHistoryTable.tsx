import { History } from "lucide-react";
import type { PlanPurchaseHistoryEntry } from "@app-types/plan";

interface PlanPurchaseHistoryTableProps {
  history: PlanPurchaseHistoryEntry[];
}

function formatDate(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString();
}

export default function PlanPurchaseHistoryTable({
  history,
}: PlanPurchaseHistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <History className="h-6 w-6 text-base-content/30" />
        <p className="text-sm text-base-content/60">No plan history yet.</p>
      </div>
    );
  }

  return (
    <div className="max-h-56 overflow-y-auto rounded-field border border-base-300">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-base-200 text-base-content/50 uppercase tracking-wide">
          <tr>
            <th className="px-3 py-2 font-semibold">Plan</th>
            <th className="px-3 py-2 font-semibold">Started</th>
            <th className="px-3 py-2 font-semibold">Expires</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id} className="border-t border-base-300">
              <td className="px-3 py-2 text-base-content">
                {entry.planName}
                <span className="ml-1 text-base-content/40">
                  ({entry.businessModelTypeAtPurchase})
                </span>
              </td>
              <td className="px-3 py-2 text-base-content/70">
                {formatDate(entry.startedAt)}
              </td>
              <td className="px-3 py-2 text-base-content/70">
                {formatDate(entry.expiresAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
