import type {
  CustomerSession,
  EventListResult,
  EventSummary,
  EventGuest,
  EventMember,
  EventTrackable,
  GateScanResult,
  TrackableScanResult,
  ScanPayload,
} from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.body instanceof FormData ? {} : {}),
      ...init?.headers,
    },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  // 204 No Content or empty body
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  async getSession(): Promise<CustomerSession> {
    // better-auth returns 200 with null body when unauthenticated
    const data = await request<CustomerSession | null>('/api/auth/customers/get-session');
    if (!data?.user?.id) throw new Error('Not authenticated');
    return data;
  },

  async signIn(email: string, password: string): Promise<CustomerSession> {
    const data = await request<CustomerSession | null>(
      '/api/auth/customers/sign-in/email',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
    if (!data?.user?.id) throw new Error('Sign in failed');
    return data;
  },

  listEvents(page = 1, pageSize = 20): Promise<EventListResult> {
    return request(`/api/customer/business-events?page=${page}&pageSize=${pageSize}`);
  },

  getEvent(eventId: string): Promise<EventSummary> {
    return request(`/api/customer/business-events/${eventId}`);
  },

  listGuests(eventId: string): Promise<EventGuest[]> {
    return request(`/api/customer/business-events/${eventId}/guests`);
  },

  listMembers(eventId: string): Promise<EventMember[]> {
    return request(`/api/customer/business-events/${eventId}/members`);
  },

  listTrackables(eventId: string): Promise<EventTrackable[]> {
    return request(`/api/customer/business-events/${eventId}/trackables`);
  },

  scanGate(eventId: string, payload: ScanPayload): Promise<GateScanResult> {
    return request(`/api/customer/business-events/${eventId}/scan`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  scanTrackable(
    eventId: string,
    trackableId: string,
    payload: ScanPayload,
  ): Promise<TrackableScanResult> {
    return request(
      `/api/customer/business-events/${eventId}/trackables/${trackableId}/scan`,
      { method: 'POST', body: JSON.stringify(payload) },
    );
  },

  updateEvent(
    eventId: string,
    dto: { name?: string; description?: string; location?: string; startAt?: string; endAt?: string },
  ): Promise<EventSummary> {
    return request(`/api/customer/business-events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  deleteEvent(eventId: string): Promise<void> {
    return request(`/api/customer/business-events/${eventId}`, { method: 'DELETE' });
  },

  lookupCustomer(email: string): Promise<{ id: string; name: string; email: string }> {
    return request(`/api/customers/lookup?email=${encodeURIComponent(email)}`);
  },

  searchCustomers(search: string, pageSize = 100): Promise<{ customers: { id: string; name: string; email: string }[]; total: number }> {
    const params = new URLSearchParams({ page: '1', pageSize: String(pageSize) });
    if (search.trim()) params.set('search', search.trim());
    return request(`/api/customers/search?${params.toString()}`);
  },

  addMember(eventId: string, customerId: string, role: 'CO_HOST' | 'VOLUNTEER'): Promise<EventMember> {
    return request(`/api/customer/business-events/${eventId}/members`, {
      method: 'POST',
      body: JSON.stringify({ customerId, role }),
    });
  },

  removeMember(eventId: string, memberId: string): Promise<void> {
    return request(`/api/customer/business-events/${eventId}/members/${memberId}`, { method: 'DELETE' });
  },

  addGuest(eventId: string, customerId: string): Promise<EventGuest> {
    return request(`/api/customer/business-events/${eventId}/guests`, {
      method: 'POST',
      body: JSON.stringify({ customerId }),
    });
  },

  removeGuest(eventId: string, guestId: string): Promise<void> {
    return request(`/api/customer/business-events/${eventId}/guests/${guestId}`, { method: 'DELETE' });
  },

  addTrackable(eventId: string, name: string, description?: string): Promise<EventTrackable> {
    return request(`/api/customer/business-events/${eventId}/trackables`, {
      method: 'POST',
      body: JSON.stringify({ name, ...(description ? { description } : {}) }),
    });
  },

  removeTrackable(eventId: string, trackableId: string): Promise<void> {
    return request(`/api/customer/business-events/${eventId}/trackables/${trackableId}`, { method: 'DELETE' });
  },

  signOut(): Promise<void> {
    return request('/api/auth/customers/sign-out', { method: 'POST' });
  },
};
