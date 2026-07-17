import { useState } from "react";
import { StickyNote, Trash2 } from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import EcardExchangeContactLocationStage from "@features/public-ecard/components/EcardExchangeContactLocationStage";
import type { GeolocationCoords } from "@features/public-ecard/components/EcardExchangeContactLocationStage";
import type { ExchangeContactSubmission } from "@app-types/lead";

interface Country {
  iso: string;
  name: string;
  dial: string;
}

const COUNTRIES: Country[] = [
  { iso: "IN", name: "India", dial: "91" },
  { iso: "US", name: "United States", dial: "1" },
  { iso: "GB", name: "United Kingdom", dial: "44" },
  { iso: "CA", name: "Canada", dial: "1" },
  { iso: "AU", name: "Australia", dial: "61" },
  { iso: "SG", name: "Singapore", dial: "65" },
  { iso: "AE", name: "United Arab Emirates", dial: "971" },
];

interface FormState {
  name: string;
  countryIso: string;
  dialCode: string;
  phone: string;
  email: string;
  note: string;
}

type FieldErrors = Partial<Record<"name" | "phone" | "email", string>>;

function isValidEmail(email: string): boolean {
  const value = email.trim();
  if (!value) return false;
  if (/\s/.test(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function isoToFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code;
  const base = 0x1f1e6;
  const first = code.toUpperCase().charCodeAt(0) - 65;
  const second = code.toUpperCase().charCodeAt(1) - 65;
  return String.fromCodePoint(base + first, base + second);
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.name.trim()) {
    errors.name = "Name is required.";
  } else if (form.name.trim().length < 2) {
    errors.name = "Enter your full name.";
  }

  if (form.email.trim() && !isValidEmail(form.email)) {
    errors.email = "Enter a valid email address.";
  }

  const phoneDigits = normalizePhone(form.phone);
  if (phoneDigits.length === 0) {
    errors.phone = "Phone number is required.";
  } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = "Enter a valid phone number (7–15 digits).";
  }

  return errors;
}

export interface EcardExchangeContactPopupProps {
  isOpen: boolean;
  /** URL the visitor's browser is redirected to (to save/open the owner's
   * contact) once the exchange submission succeeds. */
  vcardUrl: string;
  onSubmit: (payload: ExchangeContactSubmission) => Promise<void>;
  onClose: () => void;
}

type Stage = "form" | "location";

export function EcardExchangeContactPopup({
  isOpen,
  vcardUrl,
  onSubmit,
  onClose,
}: EcardExchangeContactPopupProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    countryIso: COUNTRIES[0].iso,
    dialCode: COUNTRIES[0].dial,
    phone: "",
    email: "",
    note: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [stage, setStage] = useState<Stage>("form");
  const [showNote, setShowNote] = useState(false);
  const submitAction = useAsyncAction();

  if (!isOpen) return null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose() {
    setStage("form");
    setShowNote(false);
    submitAction.reset();
    onClose();
  }

  function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStage("location");
  }

  function finalizeSubmit(coords?: GeolocationCoords) {
    void submitAction.run(
      () =>
        onSubmit({
          name: form.name.trim(),
          countryDialCode: form.dialCode,
          phoneNumber: normalizePhone(form.phone),
          email: form.email.trim() || undefined,
          note: form.note.trim() || undefined,
          locationLatitude: coords?.latitude,
          locationLongitude: coords?.longitude,
        }),
      () => {
        window.location.href = vcardUrl;
        handleClose();
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Contact exchange"
      onClick={handleClose}
    >
      <div
        className="fixed inset-x-0 bottom-0 z-50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto w-full max-w-md">
          <div
            className="max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl border border-white/20 px-5 pt-4 pb-6"
            style={{ background: "linear-gradient(180deg, #ffffff 0%, #f7f7fb 100%)" }}
          >
            <div className="flex justify-center pb-3">
              <div className="h-1.5 w-12 rounded-full bg-gray-300" />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {stage === "form" ? "Share your contact" : "Almost done"}
              </h2>
              {stage === "form" && (
                <p className="text-gray-600 text-sm mt-1">
                  Enter your phone number (required) and we&apos;ll save this card to your contacts.
                </p>
              )}
            </div>

            {submitAction.error && (
              <p className="mt-3 text-sm text-red-600">{submitAction.error}</p>
            )}

            {stage === "location" ? (
              <EcardExchangeContactLocationStage
                isSubmitting={submitAction.isSubmitting}
                onShareLocation={(coords) => finalizeSubmit(coords)}
                onSkip={() => finalizeSubmit()}
              />
            ) : (
            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Your name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Full name"
                  className={`w-full p-3 rounded-xl border text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? "border-red-500" : "border-gray-200"
                  }`}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Phone <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-3">
                  <div className="w-40">
                    <select
                      value={form.countryIso}
                      onChange={(e) => {
                        const found = COUNTRIES.find((c) => c.iso === e.target.value) ?? COUNTRIES[0];
                        update("countryIso", found.iso);
                        update("dialCode", found.dial);
                      }}
                      className="w-full p-3 rounded-xl border border-gray-200 bg-white text-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Country code"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.iso} value={country.iso}>
                          {`${isoToFlag(country.iso)} +${country.dial}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="tel"
                      autoComplete="tel"
                      placeholder="Phone number"
                      className={`w-full p-3 rounded-xl border text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? "border-red-500" : "border-gray-200"
                      }`}
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Email <span className="text-gray-400 text-xs font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`w-full p-3 rounded-xl border text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  }`}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              {!showNote ? (
                <div className="flex flex-col items-start gap-1">
                  <button
                    type="button"
                    onClick={() => setShowNote(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition"
                    aria-label="Add a note"
                    title="Add a note"
                  >
                    <StickyNote className="w-5 h-5" />
                    Add a note
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50">
                    <div className="text-xs font-semibold text-gray-900">Note (optional)</div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNote(false);
                        update("note", "");
                      }}
                      className="shrink-0 ml-3 w-7 h-7 rounded-full grid place-items-center text-gray-700 bg-white border border-gray-200 active:bg-gray-100 transition"
                      aria-label="Remove note"
                      title="Remove note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="px-3 pb-3">
                    <textarea
                      rows={2}
                      placeholder="Type your note..."
                      className="w-full mt-2 p-3 rounded-2xl border border-gray-200 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.note}
                      onChange={(e) => update("note", e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full text-white py-3 rounded-xl font-semibold transition bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-xl font-semibold border border-gray-200 text-gray-800 bg-white hover:bg-gray-50 transition"
              >
                Not now
              </button>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
