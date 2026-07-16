import { useState } from "react";
import { UserMinus, UserPlus, Users } from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import ConfirmActionModal from "@components/ConfirmActionModal";
import type {
  AssignableEventMemberRole,
  EventMemberListItem,
} from "@app-types/businessEvent";
import EventMemberRow from "@features/business-events/components/detail/EventMemberRow";
import AddEventMemberModal from "@features/business-events/components/detail/AddEventMemberModal";

interface EventMembersPanelProps {
  eventId: string;
  members: EventMemberListItem[];
  onAddMember: (
    eventId: string,
    customerId: string,
    role: AssignableEventMemberRole,
  ) => Promise<void>;
  onRemoveMember: (eventId: string, memberId: string) => Promise<void>;
}

export default function EventMembersPanel({
  eventId,
  members,
  onAddMember,
  onRemoveMember,
}: EventMembersPanelProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<EventMemberListItem | null>(
    null,
  );
  const addAction = useAsyncAction();
  const removeAction = useAsyncAction();

  function handleAddSubmit(customerId: string, role: AssignableEventMemberRole) {
    void addAction.run(
      () => onAddMember(eventId, customerId, role),
      () => setIsAddOpen(false),
    );
  }

  function handleRemoveConfirm() {
    if (!removeTarget) return;
    void removeAction.run(
      () => onRemoveMember(eventId, removeTarget.id),
      () => setRemoveTarget(null),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-content/70">
          Members ({members.length})
        </h2>
        <button
          type="button"
          onClick={() => {
            addAction.reset();
            setIsAddOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-field border border-base-300 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <UserPlus className="h-4 w-4" />
          Add member
        </button>
      </div>

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="h-8 w-8 text-base-content/30" />
            <p className="text-sm text-base-content/60">No members yet.</p>
          </div>
        ) : (
          members.map((member) => (
            <EventMemberRow
              key={member.id}
              member={member}
              onRemove={() => {
                removeAction.reset();
                setRemoveTarget(member);
              }}
            />
          ))
        )}
      </div>

      <AddEventMemberModal
        open={isAddOpen}
        isSubmitting={addAction.isSubmitting}
        error={addAction.error}
        onCancel={() => setIsAddOpen(false)}
        onSubmit={handleAddSubmit}
      />

      <ConfirmActionModal
        open={removeTarget !== null}
        icon={UserMinus}
        title={`Remove ${removeTarget?.name}?`}
        description="They lose this role on the event immediately."
        confirmLabel="Remove"
        isDestructive
        isSubmitting={removeAction.isSubmitting}
        error={removeAction.error}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
