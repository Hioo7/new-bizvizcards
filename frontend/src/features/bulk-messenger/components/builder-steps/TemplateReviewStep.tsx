interface TemplateReviewStepProps {
  name: string;
  linkedFormName: string | null;
  body: string;
}

export default function TemplateReviewStep({
  name,
  linkedFormName,
  body,
}: TemplateReviewStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-box border border-base-300 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Template
        </p>
        <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
          <span className="text-base-content/60">Name</span>
          <span className="font-medium text-base-content">{name || "—"}</span>
        </div>
        <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
          <span className="text-base-content/60">Linked form</span>
          <span className="font-medium text-base-content">
            {linkedFormName ?? "None"}
          </span>
        </div>
      </div>

      <div className="rounded-box border border-base-300 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Message
        </p>
        <p className="whitespace-pre-wrap text-sm text-base-content">{body}</p>
      </div>
    </div>
  );
}
