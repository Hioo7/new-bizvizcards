import { useState } from "react";
import type { UserSocials } from "@features/user-dashboard/types";

interface EditSocialsModalProps {
  open: boolean;
  socials: UserSocials;
  onSave: (socials: UserSocials) => void;
  onClose: () => void;
}

function EditSocialsForm({
  socials,
  onSave,
  onClose,
}: Omit<EditSocialsModalProps, "open">) {
  const [local, setLocal] = useState<UserSocials>(socials);

  function handleChange(key: keyof UserSocials, value: string) {
    setLocal(prev => ({ ...prev, [key]: value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onSave(local);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div className="form-control">
        <label className="label" htmlFor="edit-whatsapp">
          <span className="label-text">WhatsApp</span>
        </label>
        <input
          id="edit-whatsapp"
          type="text"
          value={local.whatsapp}
          onChange={(e) => handleChange("whatsapp", e.target.value)}
          className="input input-bordered w-full"
          placeholder="+91 98765 43210"
        />
      </div>

      <div className="form-control">
        <label className="label" htmlFor="edit-twitter">
          <span className="label-text">X (Twitter)</span>
        </label>
        <input
          id="edit-twitter"
          type="text"
          value={local.twitter}
          onChange={(e) => handleChange("twitter", e.target.value)}
          className="input input-bordered w-full"
          placeholder="@handle"
        />
      </div>

      <div className="form-control">
        <label className="label" htmlFor="edit-linkedin">
          <span className="label-text">LinkedIn</span>
        </label>
        <input
          id="edit-linkedin"
          type="text"
          value={local.linkedin}
          onChange={(e) => handleChange("linkedin", e.target.value)}
          className="input input-bordered w-full"
          placeholder="linkedin.com/in/username"
        />
      </div>

      <div className="form-control">
        <label className="label" htmlFor="edit-instagram">
          <span className="label-text">Instagram</span>
        </label>
        <input
          id="edit-instagram"
          type="text"
          value={local.instagram}
          onChange={(e) => handleChange("instagram", e.target.value)}
          className="input input-bordered w-full"
          placeholder="@handle"
        />
      </div>

      <div className="modal-action mt-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}

export default function EditSocialsModal({
  open,
  socials,
  onSave,
  onClose,
}: EditSocialsModalProps) {
  return (
    <dialog className="modal modal-bottom sm:modal-middle" open={open}>
      <div className="modal-box">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
              <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <h3 className="text-lg font-bold text-base-content">Edit Socials</h3>
        </div>
        <EditSocialsForm
          key={open ? "open" : "closed"}
          socials={socials}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
