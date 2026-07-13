import { FileText } from "lucide-react";
import type { EcardBrochureComponent } from "@app-types/ecard";

interface BrochureSectionProps {
  component: EcardBrochureComponent;
}

export function BrochureSection({ component }: BrochureSectionProps) {
  if (!component.pdfUrl) return null;

  return (
    // -mt-px pulls this row up over the preceding section's bottom border so
    // that line disappears too, and border-transparent keeps this row's own
    // border-b occupying the same space (for consistent section spacing)
    // without drawing a visible line — the seam should look fully seamless.
    <div className="-mt-px px-6 py-4 bg-white border-b border-transparent">
      <a
        href={component.pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 font-semibold text-white transition hover:bg-indigo-700"
      >
        <FileText className="h-4 w-4" />
        View Brochure
      </a>
    </div>
  );
}
