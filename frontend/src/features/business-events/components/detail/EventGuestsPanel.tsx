import { useState } from "react";
import { UserCheck, UserMinus, UserPlus } from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import ConfirmActionModal from "@components/ConfirmActionModal";
import type { EventGuestListItem } from "@app-types/businessEvent";
import EventGuestRow from "@features/business-events/components/detail/EventGuestRow";
import BulkAddEventGuestsModal from "@features/business-events/components/detail/BulkAddEventGuestsModal";

interface EventGuestsPanelProps {
  eventId: string;
  guests: EventGuestListItem[];
  onBulkAddGuests: (eventId: string, customerIds: string[]) => Promise<void>;
  onRemoveGuest: (eventId: string, guestId: string) => Promise<void>;
}

export default function EventGuestsPanel({
  eventId,
  guests,
  onBulkAddGuests,
  onRemoveGuest,
}: EventGuestsPanelProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<EventGuestListItem | null>(
    null,
  );
  const addAction = useAsyncAction();
  const removeAction = useAsyncAction();

  function handleAddSubmit(customerIds: string[]) {
    void addAction.run(
      () => onBulkAddGuests(eventId, customerIds),
      () => setIsAddOpen(false),
    );
  }

  function handleRemoveConfirm() {
    if (!removeTarget) return;
    void removeAction.run(
      () => onRemoveGuest(eventId, removeTarget.id),
      () => setRemoveTarget(null),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-content/70">
          Guests ({guests.length})
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
          Add guests
        </button>
      </div>

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        {guests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <UserCheck className="h-8 w-8 text-base-content/30" />
            <p className="text-sm text-base-content/60">
              No guests whitelisted yet.
            </p>
          </div>
        ) : (
          guests.map((guest) => (
            <EventGuestRow
              key={guest.id}
              guest={guest}
              onRemove={() => {
                removeAction.reset();
                setRemoveTarget(guest);
              }}
            />
          ))
        )}
      </div>

      <BulkAddEventGuestsModal
        open={isAddOpen}
        excludeCustomerIds={guests.map((guest) => guest.customerId)}
        isSubmitting={addAction.isSubmitting}
        error={addAction.error}
        onCancel={() => setIsAddOpen(false)}
        onSubmit={handleAddSubmit}
      />

      <ConfirmActionModal
        open={removeTarget !== null}
        icon={UserMinus}
        title={`Remove ${removeTarget?.name} from the guest list?`}
        description="They will no longer be able to check in or redeem trackables at this event."
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
