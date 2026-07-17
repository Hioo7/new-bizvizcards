import { useState, useEffect } from "react";
import type { Lead, UpdateLeadPayload } from "@features/user-dashboard/types";
import {
  OPPORTUNITY_STAGES,
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGE_COLORS,
  LEAD_SOURCE_LABELS,
} from "@features/user-dashboard/types";
import { useLeadReferenceNotes } from "@features/user-dashboard/hooks/useLeadReferenceNotes";
import { useLeadReminders } from "@features/user-dashboard/hooks/useLeadReminders";
import LeadNotesTab from "./LeadNotesTab";
import LeadRemindersTab from "./LeadRemindersTab";

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, payload: UpdateLeadPayload) => Promise<void>;
}

type Tab = "details" | "notes" | "reminders";

function formatUpdatedAt(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadVCard(lead: Lead) {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${lead.name}`];
  if (lead.email) lines.push(`EMAIL:${lead.email}`);
  const phone = lead.phoneNumber
    ? `${lead.countryDialCode ?? ""}${lead.phoneNumber}`
    : null;
  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
  if (lead.company) lines.push(`ORG:${lead.company}`);
  if (lead.profession) lines.push(`TITLE:${lead.profession}`);
  if (lead.location) lines.push(`ADR:;;${lead.location};;;;`);
  if (lead.note) lines.push(`NOTE:${lead.note}`);
  lines.push("END:VCARD");
  const blob = new Blob([lines.join("\n")], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${lead.name}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

interface FieldCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  empty?: string;
}

function FieldCard({ icon, label, value, empty = "Not added" }: FieldCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 shadow-sm">
      <span className="shrink-0 text-base-content/40">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-base-content/50">{label}</p>
        {value ? (
          <p className="text-sm font-medium text-base-content break-all">{value}</p>
        ) : (
          <p className="text-sm italic text-base-content/40">{empty}</p>
        )}
      </div>
    </div>
  );
}

export default function LeadDetailModal({
  lead,
  onClose,
  onDelete,
  onUpdate,
}: LeadDetailModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  // Both activeTab and isEditing are derived from lead-scoped state so they
  // automatically reset when a different lead is selected — avoids calling
  // setState directly inside a useEffect.
  const [tabState, setTabState] = useState<{ leadId: string; tab: Tab } | null>(
    null,
  );
  const activeTab: Tab =
    tabState !== null && tabState.leadId === lead?.id ? tabState.tab : "details";
  function setActiveTab(tab: Tab) {
    if (lead) setTabState({ leadId: lead.id, tab });
  }
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const isEditing = editingLeadId === lead?.id;
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDialCode, setEditDialCode] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editProfession, setEditProfession] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  const notes = useLeadReferenceNotes(lead?.id ?? "");
  const reminders = useLeadReminders(lead?.id ?? "");

  useEffect(() => {
    if (!lead) return;
    void notes.load();
    void reminders.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id]);

  if (!lead) return null;

  const phone = lead.phoneNumber
    ? `${lead.countryDialCode ?? ""}${lead.phoneNumber}`
    : null;

  function startEdit() {
    setEditName(lead?.name ?? "");
    setEditEmail(lead?.email ?? "");
    setEditPhone(lead?.phoneNumber ?? "");
    setEditDialCode(lead?.countryDialCode ?? "");
    setEditCompany(lead?.company ?? "");
    setEditProfession(lead?.profession ?? "");
    setEditLocation(lead?.location ?? "");
    setEditNote(lead?.note ?? "");
    setEditingLeadId(lead?.id ?? null);
  }

  async function handleSaveEdit() {
    if (!lead || !editName.trim()) return;
    setSaving(true);
    try {
      await onUpdate(lead.id, {
        name: editName.trim(),
        email: editEmail.trim() || null,
        countryDialCode: editDialCode.trim() || null,
        phoneNumber: editPhone.trim() || null,
        company: editCompany.trim() || null,
        profession: editProfession.trim() || null,
        location: editLocation.trim() || null,
        note: editNote.trim() || null,
      });
      setEditingLeadId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!lead) return;
    setDeleting(true);
    try {
      await onDelete(lead.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  async function handleStageChange(stage: UpdateLeadPayload["stage"]) {
    if (!lead) return;
    setUpdatingStage(true);
    setStageDropdownOpen(false);
    try {
      await onUpdate(lead.id, { stage });
    } finally {
      setUpdatingStage(false);
    }
  }

  const currentStage = lead.stage ?? null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-base-200">
      {/* ── Top nav ──────────────────────────────────────────────── */}
      <div className="shrink-0 bg-base-100 border-b border-base-300">
      <div className="mx-auto max-w-2xl flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-base-300 text-base-content/60 hover:bg-base-200"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-base-content">
            {lead.name}
          </h2>
          <p className="text-xs text-base-content/50">Lead details</p>
        </div>

        {isEditing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditingLeadId(null)}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-full border border-base-300 px-3 py-1.5 text-sm font-medium text-base-content/60 hover:bg-base-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSaveEdit()}
              disabled={saving || !editName.trim()}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-content disabled:opacity-60"
            >
              {saving ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Save"
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="flex items-center gap-1.5 rounded-full border border-base-300 px-3 py-1.5 text-sm font-medium text-base-content/60 hover:bg-base-200"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit
          </button>
        )}
      </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 pt-4 pb-10 space-y-3">

          {/* ── Hero card ──────────────────────────────────────── */}
          <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm p-5">
            {/* Avatar */}
            <div className="flex justify-center mb-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-primary" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
            </div>

            {/* Name */}
            <p className="text-center text-lg font-bold text-base-content mb-2">
              {lead.name}
            </p>

            {/* Stage badge */}
            <div className="relative flex justify-center mb-4">
              {isEditing ? (
                <>
                  {stageDropdownOpen && (
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setStageDropdownOpen(false)}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setStageDropdownOpen((v) => !v)}
                    disabled={updatingStage}
                    className={`relative z-20 inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 ${
                      currentStage
                        ? OPPORTUNITY_STAGE_COLORS[currentStage]
                        : "border border-dashed border-base-300 text-base-content/40"
                    }`}
                  >
                    {updatingStage ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <>
                        {currentStage ? OPPORTUNITY_STAGE_LABELS[currentStage] : "No stage"}
                        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 shrink-0" aria-hidden="true">
                          <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                  {stageDropdownOpen && (
                    <div className="absolute top-full z-30 mt-1 w-52 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl">
                      <button
                        type="button"
                        onClick={() => void handleStageChange(null)}
                        className="w-full px-4 py-2.5 text-left text-sm text-base-content/50 hover:bg-base-200"
                      >
                        — No stage —
                      </button>
                      {OPPORTUNITY_STAGES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void handleStageChange(s)}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-base-200 ${
                            currentStage === s ? "font-semibold text-primary" : "text-base-content"
                          }`}
                        >
                          {OPPORTUNITY_STAGE_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : currentStage ? (
                <span className={`rounded-full px-4 py-1 text-sm font-semibold ${OPPORTUNITY_STAGE_COLORS[currentStage]}`}>
                  {OPPORTUNITY_STAGE_LABELS[currentStage]}
                </span>
              ) : (
                <span className="rounded-full border border-dashed border-base-300 px-4 py-1 text-sm text-base-content/40">
                  No stage
                </span>
              )}
            </div>

            {/* Call / Message / Mail */}
            <div className="flex gap-2 mb-3">
              <a
                href={phone ? `tel:${phone}` : undefined}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-base-300 py-2.5 text-sm font-semibold text-base-content transition-colors hover:bg-base-200 ${!phone ? "pointer-events-none opacity-40" : ""}`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Call
              </a>
              <a
                href={phone ? `sms:${phone}` : undefined}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-base-300 py-2.5 text-sm font-semibold text-base-content transition-colors hover:bg-base-200 ${!phone ? "pointer-events-none opacity-40" : ""}`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Message
              </a>
              <a
                href={lead.email ? `mailto:${lead.email}` : undefined}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-base-300 py-2.5 text-sm font-semibold text-base-content transition-colors hover:bg-base-200 ${!lead.email ? "pointer-events-none opacity-40" : ""}`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mail
              </a>
            </div>

            {/* Download contact */}
            <button
              type="button"
              onClick={() => downloadVCard(lead)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral py-3 text-sm font-bold text-neutral-content transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Download contact
            </button>

            <p className="mt-2 text-center text-xs text-base-content/40">
              Updated {formatUpdatedAt(lead.updatedAt)}
            </p>
          </div>

          {/* ── Tabs (segmented control) ───────────────────────── */}
          <div className="flex gap-1 rounded-full border border-base-300 bg-base-200 p-1 shadow-sm">
            {(
              [
                {
                  id: "details" as Tab,
                  label: "Details",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="9" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  id: "notes" as Tab,
                  label: "Notes",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  id: "reminders" as Tab,
                  label: "Reminders",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  ),
                },
              ] as const
            ).map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-full py-2.5 text-xs font-semibold transition-all ${
                  activeTab === id
                    ? "bg-primary text-primary-content shadow"
                    : "bg-base-100 text-base-content/50 shadow-sm hover:text-base-content/70"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab content ────────────────────────────────────── */}
          {activeTab === "details" && (
            <div className="space-y-3">
              {isEditing ? (
                /* Edit form */
                <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm px-4 py-4 space-y-4">
                  {[
                    { label: "Name *", value: editName, onChange: setEditName, type: "text" },
                    { label: "Email", value: editEmail, onChange: setEditEmail, type: "email" },
                    { label: "Dial code", value: editDialCode, onChange: setEditDialCode, type: "text" },
                    { label: "Phone", value: editPhone, onChange: setEditPhone, type: "tel" },
                    { label: "Company", value: editCompany, onChange: setEditCompany, type: "text" },
                    { label: "Profession", value: editProfession, onChange: setEditProfession, type: "text" },
                    { label: "Location", value: editLocation, onChange: setEditLocation, type: "text" },
                  ].map(({ label, value, onChange, type }) => (
                    <div key={label} className="rounded-xl border border-base-300 bg-base-200/50 px-3 py-2">
                      <label className="text-xs font-medium text-base-content/50">{label}</label>
                      <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="mt-0.5 w-full bg-transparent text-sm font-medium text-base-content outline-none"
                      />
                    </div>
                  ))}
                  <div className="rounded-xl border border-base-300 bg-base-200/50 px-3 py-2">
                    <label className="text-xs font-medium text-base-content/50">Note</label>
                    <textarea
                      rows={3}
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="mt-0.5 w-full resize-none bg-transparent text-sm font-medium text-base-content outline-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Field cards */}
                  <FieldCard
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                    label="Email"
                    value={lead.email}
                  />

                  <FieldCard
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                    label="Phone"
                    value={phone}
                  />

                  <FieldCard
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                    label="Company"
                    value={lead.company}
                  />

                  <FieldCard
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                        <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="9" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <line x1="9" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <line x1="9" y1="15" x2="12" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    }
                    label="Profession"
                    value={lead.profession}
                  />

                  {/* Location + map */}
                  {lead.location ? (
                    <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(lead.location)}&output=embed`}
                        className="w-full border-0"
                        style={{ height: "192px" }}
                        loading="lazy"
                        title="Lead location"
                      />
                      <div className="flex items-center gap-3 px-4 py-3">
                        <span className="shrink-0 text-base-content/40">
                          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
                          </svg>
                        </span>
                        <p className="text-sm font-medium text-base-content">{lead.location}</p>
                      </div>
                    </div>
                  ) : (
                    <FieldCard
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
                        </svg>
                      }
                      label="Location"
                      value={lead.location}
                    />
                  )}

                  <FieldCard
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <line x1="9" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    }
                    label="Note"
                    value={lead.note}
                    empty="No notes"
                  />

                  <FieldCard
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                    label="Sourced by"
                    value={LEAD_SOURCE_LABELS[lead.sourcedBy]}
                  />
                </>
              )}

              {/* Delete lead */}
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-error py-3.5 text-sm font-bold text-error-content transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete lead
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm px-4 py-4">
              <LeadNotesTab
                notes={notes.notes}
                loading={notes.loading}
                error={notes.error}
                onCreate={notes.create}
                onUpdate={notes.update}
                onDelete={notes.remove}
              />
            </div>
          )}

          {activeTab === "reminders" && (
            <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm px-4 py-4">
              <LeadRemindersTab
                reminders={reminders.reminders}
                loading={reminders.loading}
                error={reminders.error}
                onCreate={reminders.create}
                onUpdate={reminders.update}
                onDelete={reminders.remove}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
