import { useState } from "react";

interface EditBioModalProps {
  open: boolean;
  profession: string;
  about: string;
  description: string;
  onSave: (profession: string, about: string, description: string) => void;
  onClose: () => void;
}

function EditBioForm({
  profession,
  about,
  description,
  onSave,
  onClose,
}: Omit<EditBioModalProps, "open">) {
  const [localProfession, setLocalProfession] = useState(profession);
  const [localAbout, setLocalAbout] = useState(about);
  const [localDescription, setLocalDescription] = useState(description);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onSave(localProfession.trim(), localAbout.trim(), localDescription.trim());
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div className="form-control">
        <label className="label" htmlFor="edit-profession">
          <span className="label-text">Profession</span>
        </label>
        <input
          id="edit-profession"
          type="text"
          value={localProfession}
          onChange={(e) => setLocalProfession(e.target.value)}
          className="input input-bordered w-full"
          placeholder="e.g. Software Engineer"
        />
      </div>

      <div className="form-control">
        <label className="label" htmlFor="edit-about">
          <span className="label-text">About</span>
        </label>
        <textarea
          id="edit-about"
          rows={3}
          value={localAbout}
          onChange={(e) => setLocalAbout(e.target.value)}
          className="textarea textarea-bordered w-full"
          placeholder="A short summary about you"
        />
      </div>

      <div className="form-control">
        <label className="label" htmlFor="edit-description">
          <span className="label-text">Description</span>
        </label>
        <textarea
          id="edit-description"
          rows={3}
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          className="textarea textarea-bordered w-full"
          placeholder="More details about your work and expertise"
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

export default function EditBioModal({
  open,
  profession,
  about,
  description,
  onSave,
  onClose,
}: EditBioModalProps) {
  return (
    <dialog className="modal modal-bottom sm:modal-middle" open={open}>
      <div className="modal-box">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
              <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <h3 className="text-lg font-bold text-base-content">Edit Professional Bio</h3>
        </div>
        <EditBioForm
          key={open ? "open" : "closed"}
          profession={profession}
          about={about}
          description={description}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
