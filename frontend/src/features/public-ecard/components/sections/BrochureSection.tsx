import { FileText } from "lucide-react";
import type { EcardBrochureComponent } from "@app-types/ecard";

interface BrochureSectionProps {
  component: EcardBrochureComponent;
}

export function BrochureSection({ component }: BrochureSectionProps) {
  if (!component.pdfUrl) return null;

  return (
    <a
      href={component.pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-26 w-full items-center justify-center gap-2 rounded-2xl border border-base-300 bg-base-200 shadow-xl"
    >
      <FileText className="h-5 w-5" />
      <h2 className="text-2xl font-bold">
        View <span className="text-primary">brochure</span>
      </h2>
    </a>
  );
}
