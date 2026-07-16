import { EMPLOYEE_BUSINESS_EVENTS_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  AddEventMemberPayload,
  BulkAddEventGuestsPayload,
  CreateEventAsEmployeePayload,
  CreateEventTrackablePayload,
  EventGuestListItem,
  EventListResponse,
  EventMemberListItem,
  EventSummary,
  EventTrackableListItem,
  ListEventsQuery,
  UpdateEventPayload,
  UpdateEventTrackablePayload,
} from "@app-types/businessEvent";

export function listEvents(
  query: ListEventsQuery,
): Promise<EventListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.search) params.set("search", query.search);

  return apiRequest<EventListResponse>(
    `${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}?${params.toString()}`,
    { method: "GET" },
  );
}

export function getEvent(id: string): Promise<EventSummary> {
  return apiRequest<EventSummary>(`${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${id}`, {
    method: "GET",
  });
}

export function createEvent(
  payload: CreateEventAsEmployeePayload,
): Promise<EventSummary> {
  return apiRequest<EventSummary>(EMPLOYEE_BUSINESS_EVENTS_BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEvent(
  id: string,
  payload: UpdateEventPayload,
): Promise<EventSummary> {
  return apiRequest<EventSummary>(`${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteEvent(id: string): Promise<void> {
  return apiRequest<void>(`${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${id}`, {
    method: "DELETE",
  });
}

export function listEventMembers(
  eventId: string,
): Promise<EventMemberListItem[]> {
  return apiRequest<EventMemberListItem[]>(
    `${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${eventId}/members`,
    { method: "GET" },
  );
}

export function addEventMember(
  eventId: string,
  payload: AddEventMemberPayload,
): Promise<EventMemberListItem> {
  return apiRequest<EventMemberListItem>(
    `${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${eventId}/members`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function removeEventMember(
  eventId: string,
  memberId: string,
): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${eventId}/members/${memberId}`,
    { method: "DELETE" },
  );
}

export function listEventGuests(
  eventId: string,
): Promise<EventGuestListItem[]> {
  return apiRequest<EventGuestListItem[]>(
    `${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${eventId}/guests`,
    { method: "GET" },
  );
}

export function bulkAddEventGuests(
  eventId: string,
  payload: BulkAddEventGuestsPayload,
): Promise<EventGuestListItem[]> {
  return apiRequest<EventGuestListItem[]>(
    `${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${eventId}/guests/bulk`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function removeEventGuest(
  eventId: string,
  guestId: string,
): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${eventId}/guests/${guestId}`,
    { method: "DELETE" },
  );
}

export function listEventTrackables(
  eventId: string,
): Promise<EventTrackableListItem[]> {
  return apiRequest<EventTrackableListItem[]>(
    `${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${eventId}/trackables`,
    { method: "GET" },
  );
}

export function createEventTrackable(
  eventId: string,
  payload: CreateEventTrackablePayload,
): Promise<EventTrackableListItem> {
  return apiRequest<EventTrackableListItem>(
    `${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${eventId}/trackables`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function updateEventTrackable(
  eventId: string,
  trackableId: string,
  payload: UpdateEventTrackablePayload,
): Promise<EventTrackableListItem> {
  return apiRequest<EventTrackableListItem>(
    `${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${eventId}/trackables/${trackableId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function removeEventTrackable(
  eventId: string,
  trackableId: string,
): Promise<void> {
  return apiRequest<void>(
    `${EMPLOYEE_BUSINESS_EVENTS_BASE_PATH}/${eventId}/trackables/${trackableId}`,
    { method: "DELETE" },
  );
}
