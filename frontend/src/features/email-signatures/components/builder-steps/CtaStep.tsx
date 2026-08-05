import type { EmailSignatureDraft } from "@features/email-signatures/types/emailSignatureDraft";
import { EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH } from "@features/email-signatures/config/emailSignatureBuilder.config";

interface CtaStepProps {
  value: EmailSignatureDraft;
  onChange: (value: EmailSignatureDraft) => void;
}

const INPUT_CLASS =
  "min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none";

export default function CtaStep({ value, onChange }: CtaStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-base-content/60">
        Optionally add a button to your signature — e.g. "Book a call" linking
        to your calendar.
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Button text
        </span>
        <input
          type="text"
          value={value.ctaText}
          maxLength={EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH}
          onChange={(event) =>
            onChange({ ...value, ctaText: event.target.value })
          }
          placeholder="Book a call"
          className={INPUT_CLASS}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-base-content/60">
          Button link
        </span>
        <input
          type="url"
          value={value.ctaUrl}
          onChange={(event) =>
            onChange({ ...value, ctaUrl: event.target.value })
          }
          placeholder="https://example.com/book"
          className={INPUT_CLASS}
        />
      </label>
    </div>
  );
}
