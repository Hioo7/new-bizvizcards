import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { MigrationPreflightCheckResult } from "../types";
import { PREFLIGHT_CHECK_GUIDANCE } from "../config";
import MigrationStatusBadge from "./MigrationStatusBadge";

interface MigrationPreflightItemProps {
  check: MigrationPreflightCheckResult;
}

export default function MigrationPreflightItem({
  check,
}: MigrationPreflightItemProps) {
  const [copied, setCopied] = useState(false);
  const guidance = PREFLIGHT_CHECK_GUIDANCE[check.id];

  async function handleCopy(command: string) {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <li className="flex flex-col gap-2 rounded-field border border-base-300 bg-base-100 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-base-content">{check.label}</span>
        <MigrationStatusBadge status={check.status} />
      </div>
      <p className="text-sm text-base-content/70">{check.detail}</p>
      {check.status === "FAILED" && guidance && (
        <div className="mt-1 flex flex-col gap-2 rounded-field bg-base-200 p-3">
          <p className="text-xs text-base-content/70">
            {guidance.instructions}
          </p>
          {guidance.command && (
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-field bg-base-300 px-2 py-1.5 text-xs whitespace-nowrap text-base-content">
                {guidance.command}
              </code>
              <button
                type="button"
                onClick={() => void handleCopy(guidance.command ?? "")}
                aria-label="Copy command"
                className="btn btn-square btn-sm min-h-11 min-w-11 border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
