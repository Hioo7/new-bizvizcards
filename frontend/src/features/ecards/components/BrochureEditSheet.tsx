import { useState } from "react";
import { BookOpen } from "lucide-react";
import BrochurePdfField from "@features/ecards/components/BrochurePdfField";
import EditSheetShell from "@components/EditSheetShell";
import type { BrochureComponentDraft } from "@features/ecards/types/ecardBuilder.types";
import type { ImageFieldValue } from "@app-types/media.types";

interface BrochureEditSheetProps {
  open: boolean;
  draft: BrochureComponentDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: BrochureComponentDraft) => void;
}

export default function BrochureEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: BrochureEditSheetProps) {
  const [pdf, setPdf] = useState<ImageFieldValue>(draft.pdf);
  const [validationError, setValidationError] = useState<string | null>(null);

  const hasPdf = Boolean(pdf.file ?? pdf.existingUrl);

  function submit() {
    if (!hasPdf) {
      setValidationError("Upload a PDF before saving.");
      return;
    }
    setValidationError(null);
    onSave({ type: "BROCHURE", pdf });
  }

  return (
    <EditSheetShell
      open={open}
      icon={BookOpen}
      title="Brochure"
      onClose={onClose}
      onSave={submit}
      isSubmitting={isSubmitting}
      error={error ?? validationError}
    >
      <p className="text-sm text-base-content/60">
        Visitors who tap this card open your brochure PDF in a new tab.
      </p>
      <BrochurePdfField label="Brochure PDF" value={pdf} onChange={setPdf} />
    </EditSheetShell>
  );
}
