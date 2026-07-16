import { useMemo } from "react";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "@services/businessEventService";
import type {
  CreateEventAsEmployeePayload,
  EventSummary,
  UpdateEventPayload,
} from "@app-types/businessEvent";

export interface UseEventManagementMutationsResult {
  createEvent: (payload: CreateEventAsEmployeePayload) => Promise<EventSummary>;
  updateEvent: (id: string, payload: UpdateEventPayload) => Promise<EventSummary>;
  deleteEvent: (id: string) => Promise<void>;
}

export function useEventManagementMutations(
  refetch: () => void,
): UseEventManagementMutationsResult {
  return useMemo(
    () => ({
      createEvent: async (payload) => {
        const result = await createEvent(payload);
        refetch();
        return result;
      },
      updateEvent: async (id, payload) => {
        const result = await updateEvent(id, payload);
        refetch();
        return result;
      },
      deleteEvent: async (id) => {
        await deleteEvent(id);
        refetch();
      },
    }),
    [refetch],
  );
}
