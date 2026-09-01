import { TextareaField } from "@bizvizcards/ui";
import { NotebookPen } from "lucide-react";

export const WithValue = () => (
  <div className="w-80">
    <TextareaField
      label="Notes"
      icon={<NotebookPen className="h-3.5 w-3.5" />}
      rows={4}
      defaultValue={
        "Met at the Bangalore trade show. Interested in the team plan — follow up next week.\n\n123 MG Road, Bengaluru 560001"
      }
    />
  </div>
);

export const Empty = () => (
  <div className="w-80">
    <TextareaField label="Message" rows={3} placeholder="Add a short note…" />
  </div>
);

export const WithError = () => (
  <div className="w-80">
    <TextareaField
      label="Notes"
      rows={3}
      defaultValue={"x".repeat(60)}
      error="Notes can't be longer than 2000 characters"
    />
  </div>
);
