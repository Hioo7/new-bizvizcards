import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { EventSummary } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function EventListPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listEvents()
      .then((res) => setEvents(res.events))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-primary px-4 pt-10 pb-5">
        <h1 className="text-2xl font-bold text-primary-content">My Events</h1>
        <p className="text-sm text-primary-content/70 mt-0.5">Tap an event to manage or scan guests</p>
      </header>

      <main className="px-4 py-4 pb-20 flex flex-col gap-3 max-w-2xl mx-auto">
        {loading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card bg-base-100 shadow-sm p-4 flex flex-col gap-2">
                <div className="skeleton h-5 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
              </div>
            ))}
          </>
        )}

        {error && (
          <div className="alert alert-error text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-base-content/40" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            </div>
            <p className="font-semibold text-base-content">No events yet</p>
            <p className="text-sm text-base-content/50">You're not a member of any events.</p>
          </div>
        )}

        {events.map((event) => (
          <button
            key={event.id}
            className="card bg-base-100 shadow-sm p-4 text-left w-full hover:shadow-md transition-shadow active:scale-[0.99]"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            <h2 className="font-bold text-base-content text-base">{event.name}</h2>
            {event.location && (
              <p className="text-sm text-base-content/60 mt-0.5 flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {event.location}
              </p>
            )}
            <p className="text-sm text-base-content/60 mt-1 flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
              {formatDate(event.startAt)}{event.endAt ? ` – ${formatDate(event.endAt)}` : ''}
            </p>
            <p className="text-xs text-base-content/40 mt-1">Host: {event.hostName}</p>
          </button>
        ))}
      </main>
    </div>
  );
}
