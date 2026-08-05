import SimpleFieldEditSheet from "@features/exchange-contact-forms/components/SimpleFieldEditSheet";
import ChoiceFieldEditSheet from "@features/exchange-contact-forms/components/ChoiceFieldEditSheet";
import type {
  BuilderField,
  FieldDraft,
} from "@features/exchange-contact-forms/types/exchangeContactFormBuilder.types";

interface FieldEditSheetRouterProps {
  editingField: BuilderField | undefined;
  onClose: () => void;
  onSave: (draft: FieldDraft) => void;
}

export default function FieldEditSheetRouter({
  editingField,
  onClose,
  onSave,
}: FieldEditSheetRouterProps) {
  const draft = editingField?.draft;
  if (!draft) return null;

  switch (draft.type) {
    case "SHORT_TEXT":
    case "LONG_TEXT":
    case "PHONE":
    case "EMAIL":
    case "LOCATION":
    case "DATE":
      return (
        <SimpleFieldEditSheet
          open
          draft={draft}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "MULTIPLE_CHOICE":
    case "DROPDOWN":
      return (
        <ChoiceFieldEditSheet
          open
          draft={draft}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "BREAK":
      // A structural marker, not a question — nothing to edit.
      return null;
  }
}
