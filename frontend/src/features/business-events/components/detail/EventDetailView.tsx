import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, Pencil, Trash2 } from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import { useStaffAuth } from "@hooks/useStaffAuth";
import { isAdminTier } from "@utils/isAdminTier";
import ConfirmActionModal from "@components/ConfirmActionModal";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import { ROUTES } from "@config/routes";
import type { UpdateEventPayload } from "@app-types/businessEvent";
import { useEventDetail } from "@features/business-events/hooks/useEventDetail";
import { useEventDetailMutations } from "@features/business-events/hooks/useEventDetailMutations";
import { useEventManagementMutations } from "@features/business-events/hooks/useEventManagementMutations";
import EventFormModal from "@features/business-events/components/EventFormModal";
import EventDetailTabs, {
  type EventDetailTab,
} from "@features/business-events/components/detail/EventDetailTabs";
import EventMembersPanel from "@features/business-events/components/detail/EventMembersPanel";
import EventGuestsPanel from "@features/business-events/components/detail/EventGuestsPanel";
import EventTrackablesPanel from "@features/business-events/components/detail/EventTrackablesPanel";

export default function EventDetailView() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { staffUser } = useStaffAuth();
  const detail = useEventDetail(eventId ?? "");
  const mutations = useEventDetailMutations(detail.refetch);
  const eventMutations = useEventManagementMutations(detail.refetch);

  const [activeTab, setActiveTab] = useState<EventDetailTab>("members");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const editAction = useAsyncAction();
  const deleteAction = useAsyncAction();

  if (!staffUser || !eventId) return null;
  const canDelete = isAdminTier(staffUser.role);

  function handleEditSubmit(payload: UpdateEventPayload) {
    void editAction.run(
      async () => {
        await eventMutations.updateEvent(eventId!, payload);
      },
      () => setIsEditOpen(false),
    );
  }

  function handleDeleteConfirm() {
    void deleteAction.run(
      async () => {
        await eventMutations.deleteEvent(eventId!);
        navigate(ROUTES.adminBusinessEvents);
      },
      () => setIsDeleteOpen(false),
    );
  }

  if (detail.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (detail.error || !detail.event) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(ROUTES.adminBusinessEvents)}
          className="flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <FormErrorRibbon message={detail.error ?? "Event not found."} />
      </div>
    );
  }

  const { event, members, guests, trackables } = detail;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => navigate(ROUTES.adminBusinessEvents)}
        className="flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </button>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold text-base-content">
            {event.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/60">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(event.startAt).toLocaleString()}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
            <span>Hosted by {event.hostName}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Edit event"
            onClick={() => {
              editAction.reset();
              setIsEditOpen(true);
            }}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {canDelete && (
            <button
              type="button"
              aria-label="Delete event"
              onClick={() => {
                deleteAction.reset();
                setIsDeleteOpen(true);
              }}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <EventDetailTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "members" && (
        <EventMembersPanel
          eventId={eventId}
          members={members}
          onAddMember={(id, customerId, role) =>
            mutations.addEventMember(id, { customerId, role })
          }
          onRemoveMember={mutations.removeEventMember}
        />
      )}
      {activeTab === "guests" && (
        <EventGuestsPanel
          eventId={eventId}
          guests={guests}
          onBulkAddGuests={(id, customerIds) =>
            mutations.bulkAddEventGuests(id, { customerIds })
          }
          onRemoveGuest={mutations.removeEventGuest}
        />
      )}
      {activeTab === "trackables" && (
        <EventTrackablesPanel
          eventId={eventId}
          trackables={trackables}
          onCreateTrackable={mutations.createEventTrackable}
          onUpdateTrackable={mutations.updateEventTrackable}
          onRemoveTrackable={mutations.removeEventTrackable}
        />
      )}

      <EventFormModal
        mode="edit"
        event={event}
        open={isEditOpen}
        isSubmitting={editAction.isSubmitting}
        error={editAction.error}
        onCancel={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <ConfirmActionModal
        open={isDeleteOpen}
        icon={Trash2}
        title={`Delete "${event.name}"?`}
        description="This removes all members, guests, and trackables. This cannot be undone."
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
