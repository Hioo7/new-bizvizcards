import { Info } from "lucide-react";

interface SendReviewStepProps {
  templateName: string;
  recipientCount: number;
}

export default function SendReviewStep({
  templateName,
  recipientCount,
}: SendReviewStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-box border border-base-300 p-4">
        <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
          <span className="text-base-content/60">Template</span>
          <span className="font-medium text-base-content">{templateName}</span>
        </div>
        <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
          <span className="text-base-content/60">Recipients</span>
          <span className="font-medium text-base-content">
            {recipientCount}{" "}
            {recipientCount === 1 ? "person" : "people"}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-field bg-info/10 px-3 py-2 text-xs text-base-content/70">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
        <span>
          Each person's message is generated and saved now. Later edits to the
          template or the leads won't change this send.
        </span>
      </div>
    </div>
  );
}
