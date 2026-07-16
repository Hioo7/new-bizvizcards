import { Settings } from "lucide-react";
import type { EcardHeroDraft } from "@features/ecards/types/ecardBuilder.types";

interface EcardSettingsCardProps {
  draft: EcardHeroDraft;
  onChange: (draft: EcardHeroDraft) => void;
}

export default function EcardSettingsCard({
  draft,
  onChange,
}: EcardSettingsCardProps) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-base-content/50">
        <Settings className="h-3 w-3" /> E-card settings
      </p>
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-field border border-base-300 bg-base-200 px-4 py-2.5">
        <span className="text-sm font-medium text-base-content">
          Auto-download contact
          <span className="block text-xs font-normal text-base-content/50">
            Automatically save a vCard when someone opens this card
          </span>
        </span>
        <input
          type="checkbox"
          className="toggle toggle-primary shrink-0"
          checked={draft.autoDownloadContact}
          onChange={(event) =>
            onChange({ ...draft, autoDownloadContact: event.target.checked })
          }
        />
      </label>
    </div>
  );
}
