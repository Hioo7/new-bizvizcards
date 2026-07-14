import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import {
  ECARD_COMPONENT_META,
  ECARD_COMPONENT_TYPES,
} from "@features/ecards/config/ecardBuilder.config";
import type { EcardComponentType } from "@app-types/ecard";

interface ComponentTypePickerModalProps {
  open: boolean;
  addedTypes: EcardComponentType[];
  isTeamDisabled?: boolean;
  onClose: () => void;
  onPick: (type: EcardComponentType) => void;
}

export default function ComponentTypePickerModal({
  open,
  addedTypes,
  isTeamDisabled = false,
  onClose,
  onPick,
}: ComponentTypePickerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const availableTypes = ECARD_COMPONENT_TYPES.filter(
    (type) => !addedTypes.includes(type),
  );

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onClose}
    >
      <div className="modal-box">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">Add a component</h3>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {availableTypes.length === 0 && (
            <p className="px-1 py-4 text-center text-sm text-base-content/50">
              Every component has been added to this card.
            </p>
          )}
          {availableTypes.map((type) => {
            const meta = ECARD_COMPONENT_META[type];
            const Icon = meta.icon;
            const isDisabled = type === "TEAM" && isTeamDisabled;
            return (
              <button
                key={type}
                type="button"
                disabled={isDisabled}
                onClick={() => onPick(type)}
                className="flex items-center gap-3 rounded-field border border-base-300 bg-base-100 px-3 py-3 text-left hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-base-300 disabled:hover:bg-base-100"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-base-content">{meta.label}</p>
                  <p className="truncate text-xs text-base-content/50">
                    {isDisabled
                      ? "Link an organisation in Hero first"
                      : meta.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="modal-action">
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
