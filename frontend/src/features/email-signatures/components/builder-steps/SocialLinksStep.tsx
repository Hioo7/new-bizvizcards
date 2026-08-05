import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { EmailSignatureSocialPlatform } from "@app-types/emailSignature";
import type { EmailSignatureSocialLinkDraft } from "@features/email-signatures/types/emailSignatureDraft";
import type { EmailSignatureDraft } from "@features/email-signatures/types/emailSignatureDraft";
import {
  EMAIL_SIGNATURE_MAX_SOCIAL_LINKS,
  EMAIL_SIGNATURE_SOCIAL_LINK_LABEL_MAX_LENGTH,
  EMAIL_SIGNATURE_SOCIAL_PLATFORM_OPTIONS,
} from "@features/email-signatures/config/emailSignatureBuilder.config";

interface SocialLinksStepProps {
  value: EmailSignatureDraft;
  onChange: (value: EmailSignatureDraft) => void;
}

const INPUT_CLASS =
  "min-h-11 w-full rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none";

function newSocialLink(): EmailSignatureSocialLinkDraft {
  return { platform: "LINKEDIN", url: "", label: "", phoneNumber: "" };
}

export default function SocialLinksStep({
  value,
  onChange,
}: SocialLinksStepProps) {
  const { socialLinks } = value;

  function updateLink(
    index: number,
    patch: Partial<EmailSignatureSocialLinkDraft>,
  ) {
    onChange({
      ...value,
      socialLinks: socialLinks.map((link, i) =>
        i === index ? { ...link, ...patch } : link,
      ),
    });
  }

  function removeLink(index: number) {
    onChange({
      ...value,
      socialLinks: socialLinks.filter((_, i) => i !== index),
    });
  }

  function moveLink(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= socialLinks.length) return;
    const next = [...socialLinks];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange({ ...value, socialLinks: next });
  }

  return (
    <div className="flex flex-col gap-3">
      {socialLinks.map((link, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-field border border-base-300 bg-base-100 p-3"
        >
          <div className="flex items-center gap-2">
            <select
              value={link.platform}
              onChange={(event) =>
                updateLink(index, {
                  platform: event.target.value as EmailSignatureSocialPlatform,
                })
              }
              className={INPUT_CLASS}
            >
              {EMAIL_SIGNATURE_SOCIAL_PLATFORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => moveLink(index, -1)}
                className="flex h-9 w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={index === socialLinks.length - 1}
                onClick={() => moveLink(index, 1)}
                className="flex h-9 w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Remove link"
                onClick={() => removeLink(index)}
                className="flex h-9 w-9 items-center justify-center rounded-field text-error hover:bg-error/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {link.platform === "WHATSAPP" ? (
            <input
              type="tel"
              value={link.phoneNumber}
              onChange={(event) =>
                updateLink(index, {
                  phoneNumber: event.target.value.replace(/[^\d]/g, ""),
                })
              }
              placeholder="Phone number with country code, digits only"
              className={INPUT_CLASS}
            />
          ) : (
            <input
              type="url"
              value={link.url}
              onChange={(event) =>
                updateLink(index, { url: event.target.value })
              }
              placeholder="https://…"
              className={INPUT_CLASS}
            />
          )}

          {link.platform === "CUSTOM" && (
            <input
              type="text"
              value={link.label}
              maxLength={EMAIL_SIGNATURE_SOCIAL_LINK_LABEL_MAX_LENGTH}
              onChange={(event) =>
                updateLink(index, { label: event.target.value })
              }
              placeholder="Label (e.g. Blog)"
              className={INPUT_CLASS}
            />
          )}
        </div>
      ))}

      {socialLinks.length < EMAIL_SIGNATURE_MAX_SOCIAL_LINKS && (
        <button
          type="button"
          onClick={() =>
            onChange({ ...value, socialLinks: [...socialLinks, newSocialLink()] })
          }
          className="flex min-h-11 items-center justify-center gap-2 rounded-field border border-dashed border-base-300 text-sm font-medium text-base-content/60 hover:bg-base-200"
        >
          <Plus className="h-4 w-4" />
          Add social link
        </button>
      )}
    </div>
  );
}
