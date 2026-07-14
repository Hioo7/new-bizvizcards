import { useState } from "react";
import type { CreateLeadPayload } from "@features/user-dashboard/types";

interface CreateLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLeadPayload) => Promise<void>;
  defaultFolderId?: string | null;
}

interface FormState {
  name: string;
  email: string;
  countryDialCode: string;
  phoneNumber: string;
  note: string;
  company: string;
  profession: string;
}

const initialFormState: FormState = {
  name: "",
  email: "",
  countryDialCode: "",
  phoneNumber: "",
  note: "",
  company: "",
  profession: "",
};

export default function CreateLeadModal({
  open,
  onClose,
  onSubmit,
  defaultFolderId,
}: CreateLeadModalProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "name" && value.trim()) {
      setNameError("");
    }
  }

  function handleClose() {
    setForm(initialFormState);
    setNameError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError("Name is required");
      return;
    }

    const payload: CreateLeadPayload = {
      name: form.name.trim(),
    };
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.countryDialCode.trim()) payload.countryDialCode = form.countryDialCode.trim();
    if (form.phoneNumber.trim()) payload.phoneNumber = form.phoneNumber.trim();
    if (form.note.trim()) payload.note = form.note.trim();
    if (form.company.trim()) payload.company = form.company.trim();
    if (form.profession.trim()) payload.profession = form.profession.trim();
    if (defaultFolderId) payload.folderId = defaultFolderId;

    setSubmitting(true);
    try {
      await onSubmit(payload);
      setForm(initialFormState);
      setNameError("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open={open}>
      <div className="modal-box max-h-[85vh] overflow-y-auto">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-primary"
              aria-hidden="true"
            >
              <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
            </svg>
          </span>
          <h3 className="text-lg font-bold text-base-content">New Lead</h3>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          {/* Name */}
          <div className="form-control">
            <label className="label" htmlFor="lead-name">
              <span className="label-text font-medium">
                Name <span className="text-error">*</span>
              </span>
            </label>
            <input
              id="lead-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className={`input input-bordered w-full ${nameError ? "input-error" : ""}`}
              placeholder="Full name"
            />
            {nameError && (
              <label className="label">
                <span className="label-text-alt text-error">{nameError}</span>
              </label>
            )}
          </div>

          {/* Email */}
          <div className="form-control">
            <label className="label" htmlFor="lead-email">
              <span className="label-text font-medium">Email</span>
            </label>
            <input
              id="lead-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="email@example.com"
            />
          </div>

          {/* Phone */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Phone</span>
            </label>
            <div className="flex gap-2">
              <input
                name="countryDialCode"
                type="text"
                value={form.countryDialCode}
                onChange={handleChange}
                className="input input-bordered w-20"
                placeholder="+1"
              />
              <input
                name="phoneNumber"
                type="tel"
                value={form.phoneNumber}
                onChange={handleChange}
                className="input input-bordered flex-1"
                placeholder="Phone number"
              />
            </div>
          </div>

          {/* Company */}
          <div className="form-control">
            <label className="label" htmlFor="lead-company">
              <span className="label-text font-medium">Company</span>
            </label>
            <input
              id="lead-company"
              name="company"
              type="text"
              value={form.company}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="Company name"
            />
          </div>

          {/* Profession */}
          <div className="form-control">
            <label className="label" htmlFor="lead-profession">
              <span className="label-text font-medium">Profession</span>
            </label>
            <input
              id="lead-profession"
              name="profession"
              type="text"
              value={form.profession}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="Job title or role"
            />
          </div>

          {/* Note */}
          <div className="form-control">
            <label className="label" htmlFor="lead-note">
              <span className="label-text font-medium">Note</span>
            </label>
            <textarea
              id="lead-note"
              name="note"
              value={form.note}
              onChange={handleChange}
              className="textarea textarea-bordered w-full"
              placeholder="Any notes about this lead..."
              rows={3}
            />
          </div>

          <div className="modal-action mt-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Create Lead"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </dialog>
  );
}
