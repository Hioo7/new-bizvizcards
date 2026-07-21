import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import type { EventSummary } from '../types';

// Convert ISO string to local datetime-local input value (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventPage() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  useEffect(() => {
    if (!eventId) return;
    api.getEvent(eventId)
      .then((ev: EventSummary) => {
        setName(ev.name);
        setDescription(ev.description ?? '');
        setLocation(ev.location ?? '');
        setStartAt(toDatetimeLocal(ev.startAt));
        setEndAt(ev.endAt ? toDatetimeLocal(ev.endAt) : '');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId || !name.trim() || !startAt) return;
    setSaving(true);
    setError(null);
    try {
      const dto: Record<string, string> = {
        name: name.trim(),
        startAt: new Date(startAt).toISOString(),
      };
      if (description.trim()) dto.description = description.trim();
      if (location.trim()) dto.location = location.trim();
      if (endAt) dto.endAt = new Date(endAt).toISOString();

      await api.updateEvent(eventId, dto);
      navigate(`/events/${eventId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-primary px-4 pt-10 pb-4 flex items-center gap-3">
        <button
          className="btn btn-ghost btn-sm text-primary-content p-1 shrink-0"
          onClick={() => navigate(`/events/${eventId ?? ''}`)}
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-primary-content">Edit Event</h1>
      </header>

      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        {error && (
          <div className="alert alert-error text-sm py-2 mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { void handleSubmit(e); }} className="card bg-base-100 shadow-sm p-4 flex flex-col gap-4">
          {/* Name */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Event Name *</span>
            <input
              type="text"
              className="input input-bordered w-full focus:outline-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
            />
          </label>

          {/* Location */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Location</span>
            <input
              type="text"
              className="input input-bordered w-full focus:outline-primary"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={saving}
              placeholder="Optional"
            />
          </label>

          {/* Start */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Start *</span>
            <input
              type="datetime-local"
              className="input input-bordered w-full focus:outline-primary"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              disabled={saving}
            />
          </label>

          {/* End */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">End</span>
            <input
              type="datetime-local"
              className="input input-bordered w-full focus:outline-primary"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              disabled={saving}
              min={startAt}
            />
          </label>

          {/* Description */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Description</span>
            <textarea
              className="textarea textarea-bordered w-full focus:outline-primary resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              placeholder="Optional"
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={saving || !name.trim() || !startAt}
          >
            {saving ? <span className="loading loading-spinner loading-sm" /> : 'Save Changes'}
          </button>
        </form>
      </main>
    </div>
  );
}
