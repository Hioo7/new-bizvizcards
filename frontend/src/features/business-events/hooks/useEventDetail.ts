import { useCallback, useEffect, useState } from "react";
import {
  getEvent,
  listEventGuests,
  listEventMembers,
  listEventTrackables,
} from "@services/businessEventService";
import type {
  EventGuestListItem,
  EventMemberListItem,
  EventSummary,
  EventTrackableListItem,
} from "@app-types/businessEvent";

export interface UseEventDetailResult {
  event: EventSummary | null;
  members: EventMemberListItem[];
  guests: EventGuestListItem[];
  trackables: EventTrackableListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEventDetail(eventId: string): UseEventDetailResult {
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [members, setMembers] = useState<EventMemberListItem[]>([]);
  const [guests, setGuests] = useState<EventGuestListItem[]>([]);
  const [trackables, setTrackables] = useState<EventTrackableListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const [eventData, memberData, guestData, trackableData] =
          await Promise.all([
            getEvent(eventId),
            listEventMembers(eventId),
            listEventGuests(eventId),
            listEventTrackables(eventId),
          ]);
        if (cancelled) return;
        setEvent(eventData);
        setMembers(memberData);
        setGuests(guestData);
        setTrackables(trackableData);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load event.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [eventId, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return { event, members, guests, trackables, isLoading, error, refetch };
}
