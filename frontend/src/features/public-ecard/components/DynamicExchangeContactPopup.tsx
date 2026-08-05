import { useState } from "react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import EcardExchangeContactLocationStage from "@features/public-ecard/components/EcardExchangeContactLocationStage";
import type { GeolocationCoords } from "@features/public-ecard/components/EcardExchangeContactLocationStage";
import { COUNTRIES, isoToFlag } from "@features/public-ecard/config/phoneCountries.config";
import type {
  ExchangeContactFormAnswerPayload,
  PublicExchangeContactForm,
  PublicExchangeContactFormField,
  SubmitCustomFormExchangeContactPayload,
} from "@app-types/exchangeContactForm";

interface PhoneValue {
  dialCode: string;
  phone: string;
}

type FieldErrors = Record<string, string>;

// The field list is split into sequential stages by BREAK markers — a form
// with zero Breaks yields exactly one segment containing every field, so
// this is a strict backward-compatible generalization of the previous
// fixed two-stage ("form" + "location") model, not a behavior change for
// existing forms. Location always renders as its own dedicated final
// stage regardless of where in the field order it sits (matches the
// legacy fixed popup's behavior), so it's excluded from segment-splitting
// entirely.
type Stage = { kind: "segment"; index: number } | { kind: "location" };

function isValidEmail(email: string): boolean {
  const value = email.trim();
  if (!value) return false;
  if (/\s/.test(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export interface DynamicExchangeContactPopupProps {
  isOpen: boolean;
  form: PublicExchangeContactForm;
  /** URL the visitor's browser is redirected to (to save/open the owner's
   * contact) once the exchange submission succeeds — same behavior as the
   * legacy popup, unrelated to what was submitted. */
  vcardUrl: string;
  onSubmit: (payload: SubmitCustomFormExchangeContactPayload) => Promise<void>;
  onClose: () => void;
}

export function DynamicExchangeContactPopup({
  isOpen,
  form,
  vcardUrl,
  onSubmit,
  onClose,
}: DynamicExchangeContactPopupProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [phoneValues, setPhoneValues] = useState<Record<string, PhoneValue>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [stage, setStage] = useState<Stage>({ kind: "segment", index: 0 });
  const submitAction = useAsyncAction();

  if (!isOpen) return null;

  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);
  const locationField = sortedFields.find((field) => field.tag === "LEAD_LOCATION");
  const stageableFields = sortedFields.filter((field) => field.type !== "LOCATION");
  const answerableFields = stageableFields.filter((field) => field.type !== "BREAK");

  const segments: PublicExchangeContactFormField[][] = [];
  let currentSegment: PublicExchangeContactFormField[] = [];
  for (const field of stageableFields) {
    if (field.type === "BREAK") {
      segments.push(currentSegment);
      currentSegment = [];
    } else {
      currentSegment.push(field);
    }
  }
  segments.push(currentSegment);

  function phoneValueFor(field: PublicExchangeContactFormField): PhoneValue {
    return phoneValues[field.id] ?? { dialCode: COUNTRIES[0].dial, phone: "" };
  }

  function handleClose() {
    setStage({ kind: "segment", index: 0 });
    submitAction.reset();
    onClose();
  }

  function validate(fieldsToValidate: PublicExchangeContactFormField[]): FieldErrors {
    const nextErrors: FieldErrors = {};
    for (const field of fieldsToValidate) {
      if (field.type === "PHONE") {
        const { phone } = phoneValueFor(field);
        const digits = normalizePhone(phone);
        if (digits.length === 0) {
          if (field.isRequired) nextErrors[field.id] = "Required.";
          continue;
        }
        if (digits.length < 7 || digits.length > 15) {
          nextErrors[field.id] = "Enter a valid phone number (7–15 digits).";
        }
        continue;
      }

      const value = (values[field.id] ?? "").trim();
      if (!value) {
        if (field.isRequired) nextErrors[field.id] = "Required.";
        continue;
      }
      if (field.type === "EMAIL" && !isValidEmail(value)) {
        nextErrors[field.id] = "Enter a valid email address.";
      }
    }
    return nextErrors;
  }

  function handleSegmentSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (stage.kind !== "segment") return;
    const segmentFields = segments[stage.index];
    const nextErrors = validate(segmentFields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const isLastSegment = stage.index === segments.length - 1;
    if (!isLastSegment) {
      setStage({ kind: "segment", index: stage.index + 1 });
      return;
    }
    if (locationField) {
      setStage({ kind: "location" });
      return;
    }
    finalizeSubmit();
  }

  function finalizeSubmit(coords?: GeolocationCoords) {
    const answers: ExchangeContactFormAnswerPayload[] = [];
    for (const field of answerableFields) {
      if (field.type === "PHONE") {
        const { dialCode, phone } = phoneValueFor(field);
        const digits = normalizePhone(phone);
        if (!digits) continue;
        answers.push({
          fieldId: field.id,
          type: "PHONE",
          countryDialCode: dialCode,
          phoneNumber: digits,
        });
        continue;
      }

      const value = (values[field.id] ?? "").trim();
      if (!value) continue;
      switch (field.type) {
        case "SHORT_TEXT":
          answers.push({ fieldId: field.id, type: "SHORT_TEXT", value });
          break;
        case "LONG_TEXT":
          answers.push({ fieldId: field.id, type: "LONG_TEXT", value });
          break;
        case "EMAIL":
          answers.push({ fieldId: field.id, type: "EMAIL", value });
          break;
        case "DATE":
          answers.push({ fieldId: field.id, type: "DATE", value });
          break;
        case "MULTIPLE_CHOICE":
          answers.push({ fieldId: field.id, type: "MULTIPLE_CHOICE", optionId: value });
          break;
        case "DROPDOWN":
          answers.push({ fieldId: field.id, type: "DROPDOWN", optionId: value });
          break;
        case "LOCATION":
        case "BREAK":
          break;
      }
    }
    if (locationField && coords) {
      answers.push({
        fieldId: locationField.id,
        type: "LOCATION",
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    }

    void submitAction.run(
      () => onSubmit({ formVersionId: form.versionId, answers }),
      () => {
        window.location.href = vcardUrl;
        handleClose();
      },
    );
  }

  function renderField(field: PublicExchangeContactFormField) {
    const error = errors[field.id];
    const labelNode = (
      <label className="block text-sm font-medium text-gray-800 mb-1">
        {field.label}
        {field.isRequired && <span className="text-red-600"> *</span>}
      </label>
    );
    const inputClass = `w-full p-3 rounded-xl border text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      error ? "border-red-500" : "border-gray-200"
    }`;

    switch (field.type) {
      case "SHORT_TEXT":
        return (
          <div key={field.id}>
            {labelNode}
            <input
              type="text"
              className={inputClass}
              value={values[field.id] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.id]: e.target.value }))
              }
            />
            {field.helpText && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        );
      case "LONG_TEXT":
        return (
          <div key={field.id}>
            {labelNode}
            <textarea
              rows={3}
              className={inputClass}
              value={values[field.id] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.id]: e.target.value }))
              }
            />
            {field.helpText && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        );
      case "EMAIL":
        return (
          <div key={field.id}>
            {labelNode}
            <input
              type="email"
              autoComplete="email"
              className={inputClass}
              value={values[field.id] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.id]: e.target.value }))
              }
            />
            {field.helpText && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        );
      case "DATE":
        return (
          <div key={field.id}>
            {labelNode}
            <input
              type="date"
              className={inputClass}
              value={values[field.id] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.id]: e.target.value }))
              }
            />
            {field.helpText && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        );
      case "PHONE": {
        const phoneValue = phoneValueFor(field);
        return (
          <div key={field.id}>
            {labelNode}
            <div className="flex gap-3">
              <div className="w-40">
                <select
                  value={phoneValue.dialCode}
                  onChange={(e) =>
                    setPhoneValues((prev) => ({
                      ...prev,
                      [field.id]: { ...phoneValue, dialCode: e.target.value },
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white text-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Country code"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.iso} value={country.dial}>
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
                  className={inputClass}
                  value={phoneValue.phone}
                  onChange={(e) =>
                    setPhoneValues((prev) => ({
                      ...prev,
                      [field.id]: { ...phoneValue, phone: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            {field.helpText && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        );
      }
      case "MULTIPLE_CHOICE":
        return (
          <div key={field.id}>
            {labelNode}
            <div className="flex flex-col gap-2">
              {field.options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black"
                >
                  <input
                    type="radio"
                    name={field.id}
                    value={option.id}
                    checked={values[field.id] === option.id}
                    onChange={() =>
                      setValues((prev) => ({ ...prev, [field.id]: option.id }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {field.helpText && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        );
      case "DROPDOWN":
        return (
          <div key={field.id}>
            {labelNode}
            <select
              value={values[field.id] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.id]: e.target.value }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="" disabled>
                Choose an option
              </option>
              {field.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.helpText && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        );
      case "LOCATION":
      case "BREAK":
        return null;
    }
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
                {stage.kind === "location" ? "Almost done" : "Share your contact"}
              </h2>
              {stage.kind === "segment" && (
                <p className="text-gray-600 text-sm mt-1">
                  Fill in the details below and we&apos;ll save this card to your
                  contacts.
                </p>
              )}
            </div>

            {submitAction.error && (
              <p className="mt-3 text-sm text-red-600">{submitAction.error}</p>
            )}

            {stage.kind === "location" ? (
              <EcardExchangeContactLocationStage
                isSubmitting={submitAction.isSubmitting}
                onShareLocation={(coords) => finalizeSubmit(coords)}
                onSkip={() => finalizeSubmit()}
              />
            ) : (
              <form onSubmit={handleSegmentSubmit} className="mt-5 space-y-4">
                {segments[stage.index].map((field) => renderField(field))}

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
