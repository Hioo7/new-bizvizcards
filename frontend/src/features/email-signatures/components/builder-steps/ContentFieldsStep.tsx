import ImageSlotField from "@components/media/ImageSlotField";
import type { EmailSignatureDraft } from "@features/email-signatures/types/emailSignatureDraft";
import {
  EMAIL_SIGNATURE_NAME_MAX_LENGTH,
  EMAIL_SIGNATURE_TEXT_MEDIUM_MAX_LENGTH,
  EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH,
} from "@features/email-signatures/config/emailSignatureBuilder.config";

interface ContentFieldsStepProps {
  value: EmailSignatureDraft;
  onChange: (value: EmailSignatureDraft) => void;
}

const INPUT_CLASS =
  "min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none";
const LABEL_CLASS = "text-xs font-semibold text-base-content/60";

export default function ContentFieldsStep({
  value,
  onChange,
}: ContentFieldsStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className={LABEL_CLASS}>Signature name (for your own reference)</span>
        <input
          type="text"
          value={value.name}
          maxLength={EMAIL_SIGNATURE_NAME_MAX_LENGTH}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="e.g. Work Signature"
          className={INPUT_CLASS}
        />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <ImageSlotField
          label="Photo"
          value={value.profileImage}
          onChange={(profileImage) => onChange({ ...value, profileImage })}
          cropShape="round"
        />
        <ImageSlotField
          label="Logo"
          value={value.companyLogo}
          onChange={(companyLogo) => onChange({ ...value, companyLogo })}
          cropShape="rect"
          skipCrop
        />
        <ImageSlotField
          label="Banner"
          value={value.bannerImage}
          onChange={(bannerImage) => onChange({ ...value, bannerImage })}
          cropShape="rect"
          variant="card"
          containerAspectClass="aspect-square"
          skipCrop
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className={LABEL_CLASS}>Full name</span>
        <input
          type="text"
          value={value.fullName}
          maxLength={EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH}
          onChange={(event) =>
            onChange({ ...value, fullName: event.target.value })
          }
          placeholder="Jane Doe"
          className={INPUT_CLASS}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLASS}>Job title</span>
          <input
            type="text"
            value={value.jobTitle}
            maxLength={EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH}
            onChange={(event) =>
              onChange({ ...value, jobTitle: event.target.value })
            }
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLASS}>Company</span>
          <input
            type="text"
            value={value.company}
            maxLength={EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH}
            onChange={(event) =>
              onChange({ ...value, company: event.target.value })
            }
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLASS}>Email</span>
          <input
            type="email"
            value={value.email}
            maxLength={EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH}
            onChange={(event) =>
              onChange({ ...value, email: event.target.value })
            }
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLASS}>Phone</span>
          <input
            type="tel"
            value={value.phone}
            onChange={(event) =>
              onChange({
                ...value,
                phone: event.target.value.replace(/[^\d]/g, ""),
              })
            }
            placeholder="Digits only"
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={LABEL_CLASS}>Website</span>
        <input
          type="url"
          value={value.website}
          onChange={(event) =>
            onChange({ ...value, website: event.target.value })
          }
          placeholder="https://example.com"
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={LABEL_CLASS}>Address</span>
        <input
          type="text"
          value={value.address}
          maxLength={EMAIL_SIGNATURE_TEXT_MEDIUM_MAX_LENGTH}
          onChange={(event) =>
            onChange({ ...value, address: event.target.value })
          }
          className={INPUT_CLASS}
        />
      </label>
    </div>
  );
}
