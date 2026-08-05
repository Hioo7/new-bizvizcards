import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import {
  CORE_FIELD_CATALOG,
  CUSTOM_QUESTION_CATALOG,
} from "@features/exchange-contact-forms/config/exchangeContactFormBuilder.config";
import type { ExchangeContactFieldTag } from "@app-types/exchangeContactForm";

interface FieldTypePickerModalProps {
  open: boolean;
  addedTags: (ExchangeContactFieldTag | null)[];
  onClose: () => void;
  onPickCore: (
    entry: (typeof CORE_FIELD_CATALOG)[number],
  ) => void;
  onPickCustom: (type: (typeof CUSTOM_QUESTION_CATALOG)[number]["type"]) => void;
}

export default function FieldTypePickerModal({
  open,
  addedTags,
  onClose,
  onPickCore,
  onPickCustom,
}: FieldTypePickerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onClose}
    >
      <div className="modal-box flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-lg">
        <div className="flex shrink-0 items-center gap-3 border-b border-base-300 px-4 py-4 sm:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">Add a field</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
            Core fields
          </p>
          <div className="flex flex-col gap-2">
            {CORE_FIELD_CATALOG.map((entry) => {
              const isAdded = addedTags.includes(entry.tag);
              const Icon = entry.icon;
              return (
                <button
                  key={entry.tag}
                  type="button"
                  disabled={isAdded}
                  onClick={() => onPickCore(entry)}
                  className="flex items-center gap-3 rounded-field border border-base-300 bg-base-100 px-3 py-3 text-left hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-base-300 disabled:hover:bg-base-100"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-base-content">
                      {entry.label}
                    </p>
                    <p className="truncate text-xs text-base-content/50">
                      {isAdded ? "Already added" : entry.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="px-1 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-base-content/50">
            Custom questions
          </p>
          <div className="flex flex-col gap-2">
            {CUSTOM_QUESTION_CATALOG.map((entry) => {
              const Icon = entry.icon;
              return (
                <button
                  key={entry.type}
                  type="button"
                  onClick={() => onPickCustom(entry.type)}
                  className="flex items-center gap-3 rounded-field border border-base-300 bg-base-100 px-3 py-3 text-left hover:border-primary hover:bg-primary/5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-base-content">
                      {entry.label}
                    </p>
                    <p className="truncate text-xs text-base-content/50">
                      {entry.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="modal-action m-0 shrink-0 border-t border-base-300 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
          >
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
