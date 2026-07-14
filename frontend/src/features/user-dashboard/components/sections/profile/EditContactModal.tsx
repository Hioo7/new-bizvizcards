import { useState } from "react";

interface EditContactModalProps {
  open: boolean;
  phone: string;
  countryCode: string;
  onSave: (phone: string, countryCode: string) => void;
  onClose: () => void;
}

function EditContactForm({
  phone,
  countryCode,
  onSave,
  onClose,
}: Omit<EditContactModalProps, "open">) {
  const [localPhone, setLocalPhone] = useState(phone);
  const [localCountryCode, setLocalCountryCode] = useState(countryCode);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onSave(localPhone.trim(), localCountryCode.trim());
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div className="form-control">
        <label className="label" htmlFor="edit-country-code">
          <span className="label-text">Country Code</span>
        </label>
        <input
          id="edit-country-code"
          type="text"
          value={localCountryCode}
          onChange={(e) => setLocalCountryCode(e.target.value)}
          className="input input-bordered w-full"
          placeholder="+91"
        />
      </div>

      <div className="form-control">
        <label className="label" htmlFor="edit-phone">
          <span className="label-text">Phone Number</span>
        </label>
        <input
          id="edit-phone"
          type="tel"
          value={localPhone}
          onChange={(e) => setLocalPhone(e.target.value)}
          className="input input-bordered w-full"
          placeholder="98765 43210"
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

export default function EditContactModal({
  open,
  phone,
  countryCode,
  onSave,
  onClose,
}: EditContactModalProps) {
  return (
    <dialog className="modal modal-bottom sm:modal-middle" open={open}>
      <div className="modal-box">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
              <path
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h3 className="text-lg font-bold text-base-content">Edit Contact</h3>
        </div>
        <EditContactForm
          key={open ? "open" : "closed"}
          phone={phone}
          countryCode={countryCode}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
