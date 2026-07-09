import { ChevronRight } from "lucide-react";
import type { SmartCardTemplateDefinition } from "@features/smart-cards/config/smartCardTemplates.config";

interface TemplateCardProps {
  template: SmartCardTemplateDefinition;
  onActivate: () => void;
}

const ACCENT_CLASSES: Record<
  SmartCardTemplateDefinition["color"],
  { bar: string; chip: string; badge: string; icon: string }
> = {
  primary: {
    bar: "bg-primary",
    chip: "from-primary/80 to-primary",
    badge: "bg-primary/10 text-primary",
    icon: "bg-primary/10 text-primary",
  },
  secondary: {
    bar: "bg-secondary",
    chip: "from-secondary/80 to-secondary",
    badge: "bg-secondary/10 text-secondary",
    icon: "bg-secondary/10 text-secondary",
  },
};

export default function TemplateCard({ template, onActivate }: TemplateCardProps) {
  const accent = ACCENT_CLASSES[template.color];

  return (
    <button
      type="button"
      onClick={onActivate}
      className="group relative flex min-h-11 flex-col gap-4 overflow-hidden rounded-box border border-base-300 bg-base-100 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${accent.bar}`} />

      <div className="flex items-start justify-between gap-3">
        <div
          className={`h-5 w-7 rounded-[3px] bg-gradient-to-br ${accent.chip} shadow-inner`}
          aria-hidden
        >
          <div className="mt-1 h-px w-full bg-base-100/40" />
          <div className="mt-1 h-px w-full bg-base-100/40" />
        </div>
        <span className={`rounded-field px-2 py-1 font-mono text-[10px] font-semibold tracking-tight ${accent.badge}`}>
          {template.key}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-extrabold text-base-content">{template.name}</h3>
        <p className="mt-1 text-sm text-base-content/60">{template.description}</p>
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {template.featureIcons.map((Icon, index) => (
            <span
              key={index}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${accent.icon}`}
            >
              <Icon className="h-4 w-4" />
            </span>
          ))}
        </div>
        <ChevronRight className="h-5 w-5 text-base-content/30 transition-transform group-hover:translate-x-1 group-hover:text-base-content/60" />
      </div>
    </button>
  );
}
