import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../SessionContext';
import { useEventRole } from '../EventRoleContext';
import { api } from '../api';
import type { EventSummary, EventGuest, EventMember, EventTrackable } from '../types';

type Tab = 'overview' | 'guests' | 'members' | 'trackables';
type UserRole = EventMember['role'] | null;

const ROLE_LABELS: Record<EventMember['role'], string> = {
  HOST: 'Host',
  CO_HOST: 'Co-Host',
  VOLUNTEER: 'Volunteer',
};

const ROLE_BADGE: Record<EventMember['role'], string> = {
  HOST: 'badge-primary',
  CO_HOST: 'badge-secondary',
  VOLUNTEER: 'badge-accent',
};

const MY_ROLE_BADGE: Record<EventMember['role'], string> = {
  HOST: 'badge-primary',
  CO_HOST: 'badge-secondary',
  VOLUNTEER: 'badge-accent badge-outline',
};

function canEdit(role: UserRole) { return role === 'HOST' || role === 'CO_HOST'; }
function canDelete(role: UserRole) { return role === 'HOST'; }
function canScan(role: UserRole) { return role !== null; }

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EventDetailPage() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const session = useSession();
  const { setRole } = useEventRole();
  const [tab, setTab] = useState<Tab>('overview');

  const [event, setEvent] = useState<EventSummary | null>(null);
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [trackables, setTrackables] = useState<EventTrackable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --- Add Member modal state ---
  const addMemberDialogRef = useRef<HTMLDialogElement>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberAllCustomers, setMemberAllCustomers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [memberListLoading, setMemberListLoading] = useState(false);
  const [memberFound, setMemberFound] = useState<{ id: string; name: string; email: string } | null>(null);
  const [memberRole, setMemberRole] = useState<'CO_HOST' | 'VOLUNTEER'>('VOLUNTEER');
  const [memberAddLoading, setMemberAddLoading] = useState(false);
  const [memberAddError, setMemberAddError] = useState<string | null>(null);

  // --- Add Guest modal state ---
  const addGuestDialogRef = useRef<HTMLDialogElement>(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [guestAllCustomers, setGuestAllCustomers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [guestListLoading, setGuestListLoading] = useState(false);
  const [guestSelected, setGuestSelected] = useState<{ id: string; name: string; email: string }[]>([]);
  const [guestAddLoading, setGuestAddLoading] = useState(false);
  const [guestAddError, setGuestAddError] = useState<string | null>(null);

  // --- Add Trackable modal state ---
  const addTrackableDialogRef = useRef<HTMLDialogElement>(null);
  const [trackableName, setTrackableName] = useState('');
  const [trackableDescription, setTrackableDescription] = useState('');
  const [trackableAddLoading, setTrackableAddLoading] = useState(false);
  const [trackableAddError, setTrackableAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    Promise.all([
      api.getEvent(eventId),
      api.listGuests(eventId),
      api.listMembers(eventId),
      api.listTrackables(eventId),
    ])
      .then(([ev, g, m, t]) => {
        setEvent(ev);
        setGuests(g);
        setMembers(m);
        setTrackables(t);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Derive the current user's role in this event by matching email
  const userRole: UserRole =
    members.find((m) => m.email === session.user.email)?.role ?? null;

  // Sync role into context so BottomNav can read it; reset on unmount
  useEffect(() => {
    setRole(userRole);
    return () => setRole(null);
  }, [userRole, setRole]);

  // When search query changes, clear selection so stale picks don't carry over
  useEffect(() => {
    setGuestSelected([]);
  }, [guestSearch]);

  // Clear member selection when search changes
  useEffect(() => {
    setMemberFound(null);
  }, [memberSearch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-base-200 px-4">
        <p className="text-error font-medium">{error ?? 'Event not found'}</p>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Back</button>
      </div>
    );
  }

  const checkedIn = guests.filter((g) => g.checkedInAt).length;

  async function handleDelete() {
    if (!eventId || !window.confirm('Delete this event? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.deleteEvent(eventId);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      setDeleting(false);
    }
  }

  // --- Member modal handlers ---
  function openAddMemberModal() {
    setMemberSearch('');
    setMemberAllCustomers([]);
    setMemberFound(null);
    setMemberRole('VOLUNTEER');
    setMemberAddError(null);
    setMemberListLoading(true);
    addMemberDialogRef.current?.showModal();
    api.searchCustomers('', 100)
      .then((res) => setMemberAllCustomers(res.customers))
      .catch(() => setMemberAllCustomers([]))
      .finally(() => setMemberListLoading(false));
  }

  async function handleAddMember() {
    if (!eventId || !memberFound) return;
    setMemberAddLoading(true);
    setMemberAddError(null);
    try {
      const newMember = await api.addMember(eventId, memberFound.id, memberRole);
      setMembers((prev) => [...prev, newMember]);
      addMemberDialogRef.current?.close();
    } catch (err) {
      setMemberAddError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setMemberAddLoading(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!eventId) return;
    try {
      await api.removeMember(eventId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }

  // --- Guest modal handlers ---
  function openAddGuestModal() {
    setGuestSearch('');
    setGuestAllCustomers([]);
    setGuestSelected([]);
    setGuestAddError(null);
    setGuestListLoading(true);
    addGuestDialogRef.current?.showModal();
    api.searchCustomers('', 100)
      .then((res) => setGuestAllCustomers(res.customers))
      .catch(() => setGuestAllCustomers([]))
      .finally(() => setGuestListLoading(false));
  }

  async function handleAddGuest() {
    if (!eventId || guestSelected.length === 0) return;
    setGuestAddLoading(true);
    setGuestAddError(null);
    try {
      const newGuests = await Promise.all(
        guestSelected.map((c) => api.addGuest(eventId, c.id)),
      );
      setGuests((prev) => [...prev, ...newGuests]);
      addGuestDialogRef.current?.close();
    } catch (err) {
      setGuestAddError(err instanceof Error ? err.message : 'Failed to add guest');
    } finally {
      setGuestAddLoading(false);
    }
  }

  async function handleRemoveGuest(guestId: string) {
    if (!eventId) return;
    try {
      await api.removeGuest(eventId, guestId);
      setGuests((prev) => prev.filter((g) => g.id !== guestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove guest');
    }
  }

  // --- Trackable modal handlers ---
  function openAddTrackableModal() {
    setTrackableName('');
    setTrackableDescription('');
    setTrackableAddError(null);
    addTrackableDialogRef.current?.showModal();
  }

  async function handleAddTrackable() {
    if (!eventId || !trackableName.trim()) return;
    setTrackableAddLoading(true);
    setTrackableAddError(null);
    try {
      const newTrackable = await api.addTrackable(
        eventId,
        trackableName.trim(),
        trackableDescription.trim() || undefined,
      );
      setTrackables((prev) => [...prev, newTrackable]);
      addTrackableDialogRef.current?.close();
    } catch (err) {
      setTrackableAddError(err instanceof Error ? err.message : 'Failed to add trackable');
    } finally {
      setTrackableAddLoading(false);
    }
  }

  async function handleRemoveTrackable(trackableId: string) {
    if (!eventId) return;
    try {
      await api.removeTrackable(eventId, trackableId);
      setTrackables((prev) => prev.filter((t) => t.id !== trackableId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove trackable');
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-primary px-4 pt-10 pb-4">
        <div className="flex items-start gap-2">
          <button
            className="btn btn-ghost btn-sm text-primary-content p-1 mt-0.5 shrink-0"
            onClick={() => navigate('/')}
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-primary-content truncate">{event.name}</h1>
              {userRole && (
                <span className={`badge badge-sm shrink-0 ${MY_ROLE_BADGE[userRole]}`}>
                  {ROLE_LABELS[userRole]}
                </span>
              )}
            </div>
            {event.location && (
              <p className="text-sm text-primary-content/70 flex items-center gap-1 mt-0.5 truncate">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {event.location}
              </p>
            )}
          </div>

          {/* Edit / Delete actions */}
          {(canEdit(userRole) || canDelete(userRole)) && (
            <div className="flex gap-1 shrink-0 mt-0.5">
              {canEdit(userRole) && (
                <button
                  className="btn btn-ghost btn-sm text-primary-content p-1"
                  onClick={() => navigate(`/events/${eventId}/edit`)}
                  aria-label="Edit event"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              )}
              {canDelete(userRole) && (
                <button
                  className="btn btn-ghost btn-sm text-primary-content p-1"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  aria-label="Delete event"
                >
                  {deleting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scan Gate button — visible to all roles */}
        {canScan(userRole) && (
          <button
            className="mt-4 btn btn-sm bg-white/20 text-white border-white/30 hover:bg-white/30 gap-2 w-full"
            onClick={() => navigate(`/events/${eventId}/scan`)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
            Scan Guest (Gate Check-In)
          </button>
        )}
      </header>

      {/* Stats strip */}
      <div className="bg-base-100 border-b border-base-300 px-4 py-3 flex justify-around">
        <div className="text-center">
          <p className="text-xl font-bold text-base-content">{guests.length}</p>
          <p className="text-xs text-base-content/50">Guests</p>
        </div>
        <div className="w-px bg-base-300" />
        <div className="text-center">
          <p className="text-xl font-bold text-success">{checkedIn}</p>
          <p className="text-xs text-base-content/50">Checked In</p>
        </div>
        <div className="w-px bg-base-300" />
        <div className="text-center">
          <p className="text-xl font-bold text-base-content">{members.length}</p>
          <p className="text-xs text-base-content/50">Staff</p>
        </div>
        <div className="w-px bg-base-300" />
        <div className="text-center">
          <p className="text-xl font-bold text-base-content">{trackables.length}</p>
          <p className="text-xs text-base-content/50">Trackables</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-border bg-base-100 border-b border-base-300 px-2">
        {(['overview', 'guests', 'members', 'trackables'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab capitalize ${tab === t ? 'tab-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">

        {tab === 'overview' && (
          <div className="flex flex-col gap-3">
            <div className="card bg-base-100 shadow-sm p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-base-content/50 uppercase font-semibold tracking-wide">Start</p>
                <p className="text-sm text-base-content">{formatDatetime(event.startAt)}</p>
              </div>
              {event.endAt && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-base-content/50 uppercase font-semibold tracking-wide">End</p>
                  <p className="text-sm text-base-content">{formatDatetime(event.endAt)}</p>
                </div>
              )}
              {event.description && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-base-content/50 uppercase font-semibold tracking-wide">Description</p>
                  <p className="text-sm text-base-content">{event.description}</p>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <p className="text-xs text-base-content/50 uppercase font-semibold tracking-wide">Host</p>
                <p className="text-sm text-base-content">{event.hostName}</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'guests' && (
          <div className="flex flex-col gap-2">
            {canEdit(userRole) && (
              <div className="flex justify-end">
                <button
                  className="btn btn-sm text-primary gap-1"
                  onClick={openAddGuestModal}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                  Add guest
                </button>
              </div>
            )}
            {guests.length === 0 && (
              <p className="text-center text-sm text-base-content/50 py-10">No guests added yet.</p>
            )}
            {guests.map((guest) => (
              <div key={guest.id} className="card bg-base-100 shadow-sm p-3 flex flex-row items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-xs font-bold text-base-content">
                  {guest.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-base-content truncate">{guest.name}</p>
                  <p className="text-xs text-base-content/50 truncate">{guest.email}</p>
                </div>
                {guest.checkedInAt ? (
                  <span className="badge badge-success badge-sm shrink-0">Checked in</span>
                ) : (
                  <span className="badge badge-ghost badge-sm shrink-0">Pending</span>
                )}
                {canEdit(userRole) && (
                  <button
                    className="btn btn-ghost btn-xs text-error shrink-0 p-1"
                    onClick={() => void handleRemoveGuest(guest.id)}
                    aria-label="Remove guest"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'members' && (
          <div className="flex flex-col gap-2">
            {canEdit(userRole) && (
              <div className="flex justify-end">
                <button
                  className="btn btn-sm text-primary gap-1"
                  onClick={openAddMemberModal}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                  Add member
                </button>
              </div>
            )}
            {members.map((member) => (
              <div key={member.id} className="card bg-base-100 shadow-sm p-3 flex flex-row items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-base-content truncate">{member.name}</p>
                    {member.email === session.user.email && (
                      <span className="text-xs text-base-content/40">(you)</span>
                    )}
                  </div>
                  <p className="text-xs text-base-content/50 truncate">{member.email}</p>
                </div>
                <span className={`badge badge-sm shrink-0 ${ROLE_BADGE[member.role]}`}>
                  {ROLE_LABELS[member.role]}
                </span>
                {canEdit(userRole) && member.email !== session.user.email && (
                  <button
                    className="btn btn-ghost btn-xs text-error shrink-0 p-1"
                    onClick={() => void handleRemoveMember(member.id)}
                    aria-label="Remove member"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'trackables' && (
          <div className="flex flex-col gap-2">
            {canEdit(userRole) && (
              <div className="flex justify-end">
                <button
                  className="btn btn-sm text-primary gap-1"
                  onClick={openAddTrackableModal}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add trackable
                </button>
              </div>
            )}
            {trackables.length === 0 && (
              <p className="text-center text-sm text-base-content/50 py-10">No trackables added yet.</p>
            )}
            {trackables.map((trackable) => (
              <div key={trackable.id} className="card bg-base-100 shadow-sm p-3 flex flex-row items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-base-content">{trackable.name}</p>
                  {trackable.description && (
                    <p className="text-xs text-base-content/50 truncate">{trackable.description}</p>
                  )}
                </div>
                {canScan(userRole) && (
                  <button
                    className="btn btn-primary btn-xs shrink-0 gap-1"
                    onClick={() => navigate(`/events/${eventId}/trackables/${trackable.id}/scan`)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    </svg>
                    Scan
                  </button>
                )}
                {canEdit(userRole) && (
                  <button
                    className="btn btn-ghost btn-xs text-error shrink-0 p-1"
                    onClick={() => void handleRemoveTrackable(trackable.id)}
                    aria-label="Remove trackable"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Member Modal */}
      <dialog ref={addMemberDialogRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box flex flex-col gap-4">
          <h3 className="font-bold text-lg">Add Member</h3>
          <input
            type="text"
            className="input input-bordered w-full input-sm"
            placeholder="Search by name or email…"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
          <div className="flex flex-col rounded-box border border-base-300 overflow-hidden max-h-52">
            {memberListLoading && (
              <div className="flex justify-center py-6">
                <span className="loading loading-spinner loading-sm" />
              </div>
            )}
            {!memberListLoading && (() => {
              const existingEmails = new Set(members.map((m) => m.email));
              const filtered = memberAllCustomers.filter((c) => {
                if (existingEmails.has(c.email)) return false;
                if (!memberSearch.trim()) return true;
                const q = memberSearch.toLowerCase();
                return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
              });
              if (filtered.length === 0) {
                return <p className="text-sm text-base-content/50 text-center py-6">No customers found</p>;
              }
              return (
                <div className="overflow-y-auto">
                  {filtered.map((customer) => {
                    const isSelected = memberFound?.id === customer.id;
                    return (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => setMemberFound(isSelected ? null : customer)}
                        className={[
                          'flex items-center gap-3 px-3 py-2 w-full text-left border-b border-base-300 last:border-b-0',
                          isSelected ? 'bg-primary/10' : 'hover:bg-base-200',
                        ].join(' ')}
                      >
                        <input type="radio" className="radio radio-sm radio-primary" checked={isSelected} onChange={() => {}} />
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base-300 text-xs font-bold text-base-content">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-base-content truncate">{customer.name}</p>
                          <p className="text-xs text-base-content/50 truncate">{customer.email}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          <select
            className="select select-bordered select-sm w-full"
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value as 'CO_HOST' | 'VOLUNTEER')}
          >
            <option value="CO_HOST">Co-Host</option>
            <option value="VOLUNTEER">Volunteer</option>
          </select>
          {memberAddError && <p className="text-error text-sm">{memberAddError}</p>}
          <div className="modal-action mt-0">
            <button className="btn btn-ghost btn-sm" onClick={() => addMemberDialogRef.current?.close()}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => void handleAddMember()}
              disabled={!memberFound || memberAddLoading}
            >
              {memberAddLoading ? <span className="loading loading-spinner loading-xs" /> : 'Add'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Add Guest Modal */}
      <dialog ref={addGuestDialogRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box flex flex-col gap-4">
          <h3 className="font-bold text-lg">Add guests</h3>
          <input
            type="text"
            className="input input-bordered w-full input-sm"
            placeholder="Search by name or email…"
            value={guestSearch}
            onChange={(e) => setGuestSearch(e.target.value)}
          />
          <div className="flex flex-col rounded-box border border-base-300 overflow-hidden max-h-64">
            {guestListLoading && (
              <div className="flex justify-center py-6">
                <span className="loading loading-spinner loading-sm" />
              </div>
            )}
            {!guestListLoading && (() => {
              const addedEmails = new Set(guests.map((g) => g.email));
              const filtered = guestAllCustomers.filter((c) => {
                if (addedEmails.has(c.email)) return false;
                if (!guestSearch.trim()) return true;
                const q = guestSearch.toLowerCase();
                return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
              });
              if (filtered.length === 0) {
                return <p className="text-sm text-base-content/50 text-center py-6">No customers found</p>;
              }
              const allVisibleSelected = filtered.every((c) => guestSelected.some((s) => s.id === c.id));
              return (
                <>
                  <button
                    type="button"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-base-200 border-b border-base-300 text-sm font-medium"
                    onClick={() => {
                      if (allVisibleSelected) {
                        const filteredIds = new Set(filtered.map((c) => c.id));
                        setGuestSelected((prev) => prev.filter((s) => !filteredIds.has(s.id)));
                      } else {
                        const existing = new Set(guestSelected.map((s) => s.id));
                        const toAdd = filtered.filter((c) => !existing.has(c.id));
                        setGuestSelected((prev) => [...prev, ...toAdd]);
                      }
                    }}
                  >
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={allVisibleSelected} onChange={() => {}} />
                    Select all ({filtered.length})
                  </button>
                  <div className="overflow-y-auto">
                    {filtered.map((customer) => {
                      const isSelected = guestSelected.some((s) => s.id === customer.id);
                      return (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => setGuestSelected((prev) =>
                            isSelected ? prev.filter((s) => s.id !== customer.id) : [...prev, customer]
                          )}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-base-200 w-full text-left"
                        >
                          <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={isSelected} onChange={() => {}} />
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base-300 text-xs font-bold text-base-content">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-base-content truncate">{customer.name}</p>
                            <p className="text-xs text-base-content/50 truncate">{customer.email}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
          {guestAddError && <p className="text-error text-sm">{guestAddError}</p>}
          <div className="modal-action mt-0">
            <button className="btn btn-ghost btn-sm" onClick={() => addGuestDialogRef.current?.close()}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => void handleAddGuest()}
              disabled={guestSelected.length === 0 || guestAddLoading}
            >
              {guestAddLoading
                ? <span className="loading loading-spinner loading-xs" />
                : guestSelected.length > 0 ? `Add guests (${guestSelected.length})` : 'Add guests'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Add Trackable Modal */}
      <dialog ref={addTrackableDialogRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add Trackable</h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              className="input input-bordered w-full input-sm"
              placeholder="Name"
              value={trackableName}
              onChange={(e) => setTrackableName(e.target.value)}
            />
            <textarea
              className="textarea textarea-bordered w-full textarea-sm"
              placeholder="Description (optional)"
              value={trackableDescription}
              onChange={(e) => setTrackableDescription(e.target.value)}
              rows={3}
            />
            {trackableAddError && (
              <p className="text-error text-sm">{trackableAddError}</p>
            )}
          </div>
          <div className="modal-action">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => addTrackableDialogRef.current?.close()}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => void handleAddTrackable()}
              disabled={!trackableName.trim() || trackableAddLoading}
            >
              {trackableAddLoading ? <span className="loading loading-spinner loading-xs" /> : 'Add'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
