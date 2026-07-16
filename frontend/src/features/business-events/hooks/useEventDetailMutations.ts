import { useMemo } from "react";
import {
  addEventMember,
  bulkAddEventGuests,
  createEventTrackable,
  removeEventGuest,
  removeEventMember,
  removeEventTrackable,
  updateEventTrackable,
} from "@services/businessEventService";
import type {
  AddEventMemberPayload,
  BulkAddEventGuestsPayload,
  CreateEventTrackablePayload,
  UpdateEventTrackablePayload,
} from "@app-types/businessEvent";

export interface UseEventDetailMutationsResult {
  addEventMember: (eventId: string, payload: AddEventMemberPayload) => Promise<void>;
  removeEventMember: (eventId: string, memberId: string) => Promise<void>;
  bulkAddEventGuests: (
    eventId: string,
    payload: BulkAddEventGuestsPayload,
  ) => Promise<void>;
  removeEventGuest: (eventId: string, guestId: string) => Promise<void>;
  createEventTrackable: (
    eventId: string,
    payload: CreateEventTrackablePayload,
  ) => Promise<void>;
  updateEventTrackable: (
    eventId: string,
    trackableId: string,
    payload: UpdateEventTrackablePayload,
  ) => Promise<void>;
  removeEventTrackable: (eventId: string, trackableId: string) => Promise<void>;
}

export function useEventDetailMutations(
  refetch: () => void,
): UseEventDetailMutationsResult {
  return useMemo(
    () => ({
      addEventMember: async (eventId, payload) => {
        await addEventMember(eventId, payload);
        refetch();
      },
      removeEventMember: async (eventId, memberId) => {
        await removeEventMember(eventId, memberId);
        refetch();
      },
      bulkAddEventGuests: async (eventId, payload) => {
        await bulkAddEventGuests(eventId, payload);
        refetch();
      },
      removeEventGuest: async (eventId, guestId) => {
        await removeEventGuest(eventId, guestId);
        refetch();
      },
      createEventTrackable: async (eventId, payload) => {
        await createEventTrackable(eventId, payload);
        refetch();
      },
      updateEventTrackable: async (eventId, trackableId, payload) => {
        await updateEventTrackable(eventId, trackableId, payload);
        refetch();
      },
      removeEventTrackable: async (eventId, trackableId) => {
        await removeEventTrackable(eventId, trackableId);
        refetch();
      },
    }),
    [refetch],
  );
}
