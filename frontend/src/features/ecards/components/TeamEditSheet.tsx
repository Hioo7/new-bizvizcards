import { useState } from "react";
import { User, UserPlus, Users, X } from "lucide-react";
import ComponentEditSheetShell from "@features/ecards/components/ComponentEditSheetShell";
import TeamMemberPickerModal from "@features/ecards/components/TeamMemberPickerModal";
import { useOrganisationMembers } from "@features/ecards/hooks/useOrganisationMembers";
import { ECARD_TEXT_SHORT_MAX_LENGTH } from "@features/ecards/config/ecardBuilder.config";
import type { TeamComponentDraft } from "@features/ecards/types/ecardBuilder.types";

interface TeamEditSheetProps {
  open: boolean;
  customerId: string;
  draft: TeamComponentDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: TeamComponentDraft) => void;
}

export default function TeamEditSheet({
  open,
  customerId,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: TeamEditSheetProps) {
  const [title, setTitle] = useState(draft.title);
  const [memberIds, setMemberIds] = useState(draft.memberIds);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { members } = useOrganisationMembers(customerId);

  const selectedMembers = memberIds
    .map((id) => members.find((member) => member.id === id))
    .filter((member) => member !== undefined);

  function removeMember(memberId: string) {
    setMemberIds(memberIds.filter((id) => id !== memberId));
  }

  return (
    <>
      <ComponentEditSheetShell
        open={open}
        icon={Users}
        title="Team"
        onClose={onClose}
        onSave={() => onSave({ type: "TEAM", title, memberIds })}
        isSubmitting={isSubmitting}
        error={error}
      >
        <div>
          <label
            htmlFor="team-title"
            className="mb-1.5 block text-xs font-semibold text-base-content/70"
          >
            Section title (optional)
          </label>
          <input
            id="team-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={ECARD_TEXT_SHORT_MAX_LENGTH}
            placeholder="My Team"
            className="w-full rounded-field border border-base-300 bg-base-200 px-3 py-2.5 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-base-content/70">
            Teammates
          </p>
          {selectedMembers.length === 0 && (
            <p className="rounded-field border border-dashed border-base-300 px-3 py-4 text-center text-sm text-base-content/50">
              No teammates added yet.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {selectedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-field border border-base-300 bg-base-200 px-3 py-2"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/60">
                  <User className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-base-content">
                    {member.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(member.id)}
                  aria-label={`Remove ${member.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base-content/40 hover:bg-error/10 hover:text-error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="btn mt-2 min-h-11 w-full gap-2 rounded-field border border-dashed border-base-300 bg-base-100 text-sm text-base-content hover:bg-base-200"
          >
            <UserPlus className="h-4 w-4" />
            Add teammates
          </button>
        </div>
      </ComponentEditSheetShell>

      <TeamMemberPickerModal
        open={isPickerOpen}
        customerId={customerId}
        selectedIds={memberIds}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={(ids) => {
          setMemberIds(ids);
          setIsPickerOpen(false);
        }}
      />
    </>
  );
}
