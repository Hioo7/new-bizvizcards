export type EventMemberRole = "HOST" | "CO_HOST" | "VOLUNTEER";
export type AssignableEventMemberRole = Exclude<EventMemberRole, "HOST">;

export interface EventSummary {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  hostCustomerId: string;
  hostName: string;
  createdByEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventListResponse {
  events: EventSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListEventsQuery {
  search?: string;
  page: number;
  pageSize: number;
}

export interface CreateEventAsEmployeePayload {
  customerId: string;
  name: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt?: string;
}

export interface UpdateEventPayload {
  name?: string;
  description?: string;
  location?: string;
  startAt?: string;
  endAt?: string;
}

export interface EventMemberListItem {
  id: string;
  customerId: string;
  name: string;
  email: string;
  role: EventMemberRole;
  joinedAt: string;
}

export interface AddEventMemberPayload {
  customerId: string;
  role: AssignableEventMemberRole;
}

export interface EventGuestListItem {
  id: string;
  customerId: string;
  name: string;
  email: string;
  checkedInAt: string | null;
}

export interface BulkAddEventGuestsPayload {
  customerIds: string[];
}

export interface EventTrackableDependency {
  id: string;
  name: string;
}

export interface EventTrackableListItem {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  redemptionCount: number;
  dependencies: EventTrackableDependency[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventTrackablePayload {
  name: string;
  description?: string;
  dependsOnTrackableIds?: string[];
}

export interface UpdateEventTrackablePayload {
  name?: string;
  description?: string;
  dependsOnTrackableIds?: string[];
}
