import { useState } from "react";
import type { CreateAddressPayload } from "@features/user-dashboard/types";

interface AddressFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreateAddressPayload) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}

interface FormState {
  label: string;
  contactName: string;
  contactPhoneCountryDialCode: string;
  contactPhoneNumber: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const REQUIRED_FIELDS: (keyof FormState)[] = [
  "label",
  "contactName",
  "contactPhoneCountryDialCode",
  "contactPhoneNumber",
  "line1",
  "city",
  "state",
  "country",
  "pincode",
];

function emptyForm(): FormState {
  return {
    label: "",
    contactName: "",
    contactPhoneCountryDialCode: "",
    contactPhoneNumber: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  for (const field of REQUIRED_FIELDS) {
    if (!form[field].trim()) {
      errors[field] = "This field is required";
    }
  }
  return errors;
}

export default function AddressFormSheet({
  open,
  onClose,
  onSave,
  isSaving,
  error,
}: AddressFormSheetProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  if (!open) return null;

  const errors = validate(form);
  const showError = (field: keyof FormState) =>
    (submitAttempted || touched[field]) ? errors[field] : undefined;

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleBlur(field: keyof FormState) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit() {
    setSubmitAttempted(true);
    if (Object.keys(validate(form)).length > 0) return;
    const payload: CreateAddressPayload = {
      label: form.label.trim(),
      contactName: form.contactName.trim(),
      contactPhoneCountryDialCode: form.contactPhoneCountryDialCode.trim(),
      contactPhoneNumber: form.contactPhoneNumber.trim(),
      line1: form.line1.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      pincode: form.pincode.trim(),
      ...(form.line2.trim() ? { line2: form.line2.trim() } : {}),
    };
    await onSave(payload);
  }

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open>
      <div className="modal-box p-0 overflow-hidden sm:max-w-lg rounded-t-3xl rounded-b-none sm:rounded-2xl">
        <div className="flex flex-col max-h-[92dvh]">
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-base-300" />
          </div>

          {/* Header */}
          <div className="shrink-0 flex items-center gap-3 px-5 pt-4 pb-4 border-b border-base-200">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-base-200 text-base-content/60"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-base-content">New Address</p>
              <p className="text-xs text-base-content/50">Enter delivery details</p>
            </div>
          </div>

          {/* Scrollable form */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 flex flex-col gap-4 pb-6">
            {/* Label */}
            <Field
              label="Label"
              placeholder="Home / Office / Other"
              value={form.label}
              error={showError("label")}
              onChange={(v) => handleChange("label", v)}
              onBlur={() => handleBlur("label")}
            />

            {/* Contact Name */}
            <Field
              label="Contact Name"
              placeholder="Full name"
              value={form.contactName}
              error={showError("contactName")}
              onChange={(v) => handleChange("contactName", v)}
              onBlur={() => handleBlur("contactName")}
            />

            {/* Phone */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-base-content/70">Phone</span>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 w-24 shrink-0">
                  <input
                    type="text"
                    placeholder="+91"
                    value={form.contactPhoneCountryDialCode}
                    onChange={(e) => handleChange("contactPhoneCountryDialCode", e.target.value)}
                    onBlur={() => handleBlur("contactPhoneCountryDialCode")}
                    className={`input input-bordered w-full text-sm ${showError("contactPhoneCountryDialCode") ? "input-error" : ""}`}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={form.contactPhoneNumber}
                    onChange={(e) => handleChange("contactPhoneNumber", e.target.value)}
                    onBlur={() => handleBlur("contactPhoneNumber")}
                    className={`input input-bordered w-full text-sm ${showError("contactPhoneNumber") ? "input-error" : ""}`}
                  />
                </div>
              </div>
              {(showError("contactPhoneCountryDialCode") || showError("contactPhoneNumber")) && (
                <p className="text-xs text-error">Phone details are required</p>
              )}
            </div>

            {/* Address Line 1 */}
            <Field
              label="Address Line 1"
              placeholder="House / flat / building"
              value={form.line1}
              error={showError("line1")}
              onChange={(v) => handleChange("line1", v)}
              onBlur={() => handleBlur("line1")}
            />

            {/* Address Line 2 (optional) */}
            <Field
              label="Address Line 2 (optional)"
              placeholder="Street / area / locality"
              value={form.line2}
              onChange={(v) => handleChange("line2", v)}
              onBlur={() => handleBlur("line2")}
            />

            {/* City + State row */}
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="City"
                placeholder="City"
                value={form.city}
                error={showError("city")}
                onChange={(v) => handleChange("city", v)}
                onBlur={() => handleBlur("city")}
              />
              <Field
                label="State"
                placeholder="State"
                value={form.state}
                error={showError("state")}
                onChange={(v) => handleChange("state", v)}
                onBlur={() => handleBlur("state")}
              />
            </div>

            {/* Country + Pincode row */}
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Country"
                placeholder="Country"
                value={form.country}
                error={showError("country")}
                onChange={(v) => handleChange("country", v)}
                onBlur={() => handleBlur("country")}
              />
              <Field
                label="Pincode"
                placeholder="Pincode / ZIP"
                value={form.pincode}
                error={showError("pincode")}
                onChange={(v) => handleChange("pincode", v)}
                onBlur={() => handleBlur("pincode")}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSaving}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-content hover:opacity-90 disabled:opacity-60"
            >
              {isSaving && <span className="loading loading-spinner loading-sm" />}
              Save Address
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}

interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function Field({ label, placeholder, value, error, onChange, onBlur }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-base-content/70">{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`input input-bordered w-full text-sm ${error ? "input-error" : ""}`}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
