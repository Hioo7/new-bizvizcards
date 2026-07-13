import { useEffect, useRef, useState } from "react";
import { Check, User, Users } from "lucide-react";
import { useOrganisationMembers } from "@features/ecards/hooks/useOrganisationMembers";
import { ECARD_MAX_TEAM_MEMBERS } from "@features/ecards/config/ecardBuilder.config";

interface TeamMemberPickerModalProps {
  open: boolean;
  customerId: string;
  selectedIds: string[];
  onClose: () => void;
  onConfirm: (memberIds: string[]) => void;
}

export default function TeamMemberPickerModal({
  open,
  customerId,
  selectedIds,
  onClose,
  onConfirm,
}: TeamMemberPickerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { members, isLoading, error } = useOrganisationMembers(customerId);
  const [picked, setPicked] = useState<string[]>(selectedIds);
  const [prevOpen, setPrevOpen] = useState(open);

  // Re-sync the working selection only on the false->true transition (the
  // sheet opening), not on every parent re-render — adjusting state during
  // render instead of in an effect, per React's guidance for this exact case.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setPicked(selectedIds);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function toggle(memberId: string) {
    setPicked((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : current.length >= ECARD_MAX_TEAM_MEMBERS
          ? current
          : [...current, memberId],
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onClose}
    >
      <div className="modal-box flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-md">
        <div className="flex shrink-0 items-center gap-3 border-b border-base-300 px-4 py-4 sm:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-base-content">Pick teammates</h3>
        </div>

        <div className="max-h-[60vh] flex-1 overflow-y-auto p-2 sm:p-3">
          {isLoading && (
            <p className="px-3 py-3 text-sm text-base-content/50">Loading…</p>
          )}
          {error && <p className="px-3 py-3 text-sm text-error">{error}</p>}
          {!isLoading && !error && members.length === 0 && (
            <p className="px-3 py-3 text-sm text-base-content/50">
              No other members in this organisation yet.
            </p>
          )}
          {members.map((member) => {
            const isChecked = picked.includes(member.id);
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggle(member.id)}
                className="flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-left hover:bg-base-200"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/60">
                  <User className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-base-content">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-base-content/50">{member.email}</p>
                </div>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    isChecked
                      ? "border-primary bg-primary text-primary-content"
                      : "border-base-300 text-transparent"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>

        <div className="modal-action m-0 shrink-0 border-t border-base-300 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(picked)}
            className="btn min-h-11 rounded-field bg-primary text-primary-content hover:bg-primary/90"
          >
            Done ({picked.length})
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
