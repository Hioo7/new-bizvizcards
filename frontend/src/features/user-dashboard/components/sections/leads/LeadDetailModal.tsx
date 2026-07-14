import { useState } from "react";
import type { Lead } from "@features/user-dashboard/types";

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-base-content/50">{label}</p>
      <p className="text-sm text-base-content">{value}</p>
    </div>
  );
}

export default function LeadDetailModal({
  lead,
  onClose,
  onDelete,
}: LeadDetailModalProps) {
  const [deleting, setDeleting] = useState(false);

  if (!lead) return null;

  const phone =
    lead.phoneNumber
      ? `${lead.countryDialCode ?? ""}${lead.phoneNumber}`
      : null;

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

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open={!!lead}>
      <div className="modal-box">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content">
            {lead.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-base-content">
              {lead.name}
            </h3>
            <p className="text-xs text-base-content/50">
              Added {formatDate(lead.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-base-200 p-4">
          <DetailRow label="Email" value={lead.email} />
          <DetailRow label="Phone" value={phone} />
          <DetailRow label="Profession" value={lead.profession} />
          <DetailRow label="Company" value={lead.company} />
          <DetailRow label="Location" value={lead.location} />
          <DetailRow label="Note" value={lead.note} />
        </div>

        <div className="modal-action mt-4">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-error"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            {deleting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Delete Lead"
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
