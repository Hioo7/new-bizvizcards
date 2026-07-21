export interface EventSummary {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  hostCustomerId: string;
  hostName: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventListResult {
  events: EventSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EventGuest {
  id: string;
  customerId: string;
  name: string;
  email: string;
  checkedInAt: string | null;
}

export interface EventMember {
  id: string;
  customerId: string;
  name: string;
  email: string;
  role: 'HOST' | 'CO_HOST' | 'VOLUNTEER';
  joinedAt: string;
}

export interface EventTrackable {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GateScanResult {
  eventGuestId: string;
  customerId: string;
  customerName: string;
  checkedInAt: string;
}

export interface TrackableScanResult {
  redemptionId: string;
  eventGuestId: string;
  customerId: string;
  customerName: string;
  redeemedAt: string;
}

export interface CustomerSession {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ScanPayload {
  cardType: 'ECARD' | 'SMART_CARD';
  endpoint: string;
}
