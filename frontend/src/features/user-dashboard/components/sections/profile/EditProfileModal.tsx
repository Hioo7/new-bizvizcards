import { useRef, useState } from "react";
import type { AuthUser } from "@app-types/auth";
import { updateUserName, updateUserImage, updateProfilePicture } from "@services/authService";
import { ApiError } from "@services/apiClient";

interface EditProfileModalProps {
  open: boolean;
  user: AuthUser;
  onSave: (updatedUser: AuthUser) => void;
  onClose: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface FormInnerProps {
  user: AuthUser;
  onSave: (updatedUser: AuthUser) => void;
  onClose: () => void;
}

function FormInner({ user, onSave, onClose }: FormInnerProps) {
  const [name, setName] = useState(user.name);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.image);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      let updatedUser = { ...user };

      if (name.trim() && name.trim() !== user.name) {
        const res = await updateUserName(name.trim());
        updatedUser = { ...updatedUser, ...res.user };
      }

      if (pendingFile) {
        const res = await updateProfilePicture(pendingFile);
        await updateUserImage(res.pfpUrl);
        updatedUser = { ...updatedUser, image: res.pfpUrl };
      }

      onSave(updatedUser);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Failed to save changes.");
      } else {
        setError("Failed to save changes.");
      }
    } finally {
      setSaving(false);
    }
  }

  const initials = getInitials(user.name);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <h3 className="text-lg font-bold text-base-content">Edit Profile</h3>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-base-200 text-base-content/50"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
        {/* Profile picture */}
        <div className="rounded-2xl border border-base-300 bg-base-200/50 p-4 flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-medium text-base-content/60">
              Profile picture
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-primary px-4 py-1 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              Change
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
            aria-label="Upload profile photo"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/30"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 ring-4 ring-primary/30">
                <span className="text-2xl font-bold text-primary">
                  {initials}
                </span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white" aria-hidden="true">
                <path
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>

          <p className="text-xs text-base-content/50">
            Tap to upload and align your profile photo
          </p>
        </div>

        {/* Name */}
        <div className="rounded-2xl border border-base-300 bg-base-200/50 px-4 py-3">
          <label
            htmlFor="edit-profile-name"
            className="text-xs font-medium text-base-content/50"
          >
            Name
          </label>
          <div className="flex items-center gap-3 mt-1">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-primary" aria-hidden="true">
              <path
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              id="edit-profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-transparent text-sm font-medium text-base-content outline-none placeholder:text-base-content/30"
              placeholder="Your name"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="rounded-2xl border border-base-300 bg-base-200/50 px-4 py-3">
          <span className="text-xs font-medium text-base-content/50">Email</span>
          <div className="flex items-center gap-3 mt-1">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-success" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M2 8l10 7 10-7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span className="flex-1 text-sm font-medium text-base-content">
              {user.email}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-error text-center">{error}</p>
        )}
      </div>

      {/* Save button */}
      <div className="px-5 pb-6 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[52px] rounded-2xl bg-primary text-sm font-bold text-primary-content transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-60"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="loading loading-spinner loading-xs" />
              Saving...
            </span>
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </form>
  );
}

export default function EditProfileModal({
  open,
  user,
  onSave,
  onClose,
}: EditProfileModalProps) {
  return (
    <dialog
      className="modal modal-bottom sm:modal-middle"
      open={open}
    >
      <div className="modal-box p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <FormInner key={user.id + user.name + (user.image ?? "")} user={user} onSave={onSave} onClose={onClose} />
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
