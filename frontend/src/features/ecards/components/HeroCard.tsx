import { useEffect, useMemo } from "react";
import { Pencil, Sparkles } from "lucide-react";
import type { EcardHeroDraft } from "@features/ecards/types/ecardBuilder.types";

interface HeroCardProps {
  draft: EcardHeroDraft;
  onEdit: () => void;
}

export default function HeroCard({ draft, onEdit }: HeroCardProps) {
  const objectUrl = useMemo(
    () => (draft.photo.file ? URL.createObjectURL(draft.photo.file) : null),
    [draft.photo.file],
  );

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const previewUrl = objectUrl ?? draft.photo.existingUrl ?? null;

  return (
    <div className="flex items-center gap-3 rounded-box border border-primary/30 bg-primary/5 p-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-base-300 bg-base-200">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Sparkles className="h-6 w-6 text-base-content/30" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">
          <Sparkles className="h-3 w-3" /> Hero — required
        </p>
        <p className="truncate text-sm font-semibold text-base-content">
          {draft.name || "Untitled card"}
        </p>
        <p className="truncate text-xs text-base-content/50">
          {draft.companyName || `/${draft.endpoint || "no-url-yet"}`}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit hero"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
