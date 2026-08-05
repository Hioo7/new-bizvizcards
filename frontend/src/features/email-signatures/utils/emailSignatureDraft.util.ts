import { emptyImageField, type ImageFieldValue } from "@app-types/media.types";
import type {
  EmailSignature,
  EmailSignatureImageSlotPayload,
  EmailSignatureImageUpload,
  EmailSignaturePayload,
  EmailSignaturePreviewPayload,
  EmailSignatureSocialLinkPayload,
} from "@app-types/emailSignature";
import {
  EMAIL_SIGNATURE_BANNER_IMAGE_FIELD,
  EMAIL_SIGNATURE_COMPANY_LOGO_FIELD,
  EMAIL_SIGNATURE_PROFILE_IMAGE_FIELD,
} from "@features/email-signatures/config/emailSignatureFields";
import { EMAIL_SIGNATURE_WHATSAPP_URL_PREFIX } from "@features/email-signatures/config/emailSignatureBuilder.config";
import type {
  EmailSignatureDraft,
  EmailSignatureSocialLinkDraft,
} from "@features/email-signatures/types/emailSignatureDraft";

export function createDefaultEmailSignatureDraft(): EmailSignatureDraft {
  return {
    name: "",
    templateKey: "MODERN",
    fullName: "",
    jobTitle: "",
    company: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    ctaText: "",
    ctaUrl: "",
    profileImage: emptyImageField(),
    companyLogo: emptyImageField(),
    bannerImage: emptyImageField(),
    socialLinks: [],
  };
}

function existingImageField(
  mediaId: string | null,
  url: string | null,
): ImageFieldValue {
  if (!mediaId || !url) return emptyImageField();
  return { file: null, existingMediaId: mediaId, existingUrl: url };
}

function extractWhatsAppPhoneNumber(url: string): string {
  return url.startsWith(EMAIL_SIGNATURE_WHATSAPP_URL_PREFIX)
    ? url.slice(EMAIL_SIGNATURE_WHATSAPP_URL_PREFIX.length)
    : "";
}

export function emailSignatureToDraft(
  signature: EmailSignature,
): EmailSignatureDraft {
  return {
    name: signature.name,
    templateKey: signature.templateKey,
    fullName: signature.fullName,
    jobTitle: signature.jobTitle ?? "",
    company: signature.company ?? "",
    email: signature.email ?? "",
    phone: signature.phone ?? "",
    website: signature.website ?? "",
    address: signature.address ?? "",
    ctaText: signature.ctaText ?? "",
    ctaUrl: signature.ctaUrl ?? "",
    profileImage: existingImageField(
      signature.profileImageMediaId,
      signature.profileImageUrl,
    ),
    companyLogo: existingImageField(
      signature.companyLogoMediaId,
      signature.companyLogoUrl,
    ),
    bannerImage: existingImageField(
      signature.bannerImageMediaId,
      signature.bannerImageUrl,
    ),
    socialLinks: signature.socialLinks.map((link) => ({
      platform: link.platform,
      url: link.platform === "WHATSAPP" ? "" : link.url,
      label: link.label ?? "",
      phoneNumber:
        link.platform === "WHATSAPP"
          ? extractWhatsAppPhoneNumber(link.url)
          : "",
    })),
  };
}

function toSocialLinkPayload(
  link: EmailSignatureSocialLinkDraft,
): EmailSignatureSocialLinkPayload {
  if (link.platform === "CUSTOM") {
    return { platform: "CUSTOM", url: link.url, label: link.label };
  }
  if (link.platform === "WHATSAPP") {
    return { platform: "WHATSAPP", phoneNumber: link.phoneNumber };
  }
  return { platform: link.platform, url: link.url };
}

function toImageSlotPayload(
  value: ImageFieldValue,
): EmailSignatureImageSlotPayload | undefined {
  if (value.file) return { action: "upload" };
  if (value.existingMediaId) {
    return { action: "keep", mediaId: value.existingMediaId };
  }
  return undefined;
}

export function buildEmailSignaturePayload(draft: EmailSignatureDraft): {
  payload: EmailSignaturePayload;
  files: EmailSignatureImageUpload[];
} {
  const payload: EmailSignaturePayload = {
    name: draft.name.trim(),
    templateKey: draft.templateKey,
    fullName: draft.fullName.trim(),
    jobTitle: draft.jobTitle.trim() || undefined,
    company: draft.company.trim() || undefined,
    email: draft.email.trim() || undefined,
    phone: draft.phone.trim() || undefined,
    website: draft.website.trim() || undefined,
    address: draft.address.trim() || undefined,
    ctaText: draft.ctaText.trim() || undefined,
    ctaUrl: draft.ctaUrl.trim() || undefined,
    profileImage: toImageSlotPayload(draft.profileImage),
    companyLogo: toImageSlotPayload(draft.companyLogo),
    bannerImage: toImageSlotPayload(draft.bannerImage),
    socialLinks: draft.socialLinks.map(toSocialLinkPayload),
  };

  const files: EmailSignatureImageUpload[] = [];
  if (draft.profileImage.file) {
    files.push({
      fieldName: EMAIL_SIGNATURE_PROFILE_IMAGE_FIELD,
      file: draft.profileImage.file,
    });
  }
  if (draft.companyLogo.file) {
    files.push({
      fieldName: EMAIL_SIGNATURE_COMPANY_LOGO_FIELD,
      file: draft.companyLogo.file,
    });
  }
  if (draft.bannerImage.file) {
    files.push({
      fieldName: EMAIL_SIGNATURE_BANNER_IMAGE_FIELD,
      file: draft.bannerImage.file,
    });
  }

  return { payload, files };
}

/** Preview needs plain, already-resolved image URLs rather than upload
 * slots — the caller resolves each slot to either its existing URL or a
 * local blob URL for a freshly-picked, not-yet-uploaded file. */
export function buildEmailSignaturePreviewPayload(
  draft: EmailSignatureDraft,
  imageUrls: {
    profileImageUrl?: string;
    companyLogoUrl?: string;
    bannerImageUrl?: string;
  },
): EmailSignaturePreviewPayload {
  return {
    templateKey: draft.templateKey,
    fullName: draft.fullName.trim(),
    jobTitle: draft.jobTitle.trim() || undefined,
    company: draft.company.trim() || undefined,
    email: draft.email.trim() || undefined,
    phone: draft.phone.trim() || undefined,
    website: draft.website.trim() || undefined,
    address: draft.address.trim() || undefined,
    ctaText: draft.ctaText.trim() || undefined,
    ctaUrl: draft.ctaUrl.trim() || undefined,
    profileImageUrl: imageUrls.profileImageUrl,
    companyLogoUrl: imageUrls.companyLogoUrl,
    bannerImageUrl: imageUrls.bannerImageUrl,
    socialLinks: draft.socialLinks.map(toSocialLinkPayload),
  };
}
