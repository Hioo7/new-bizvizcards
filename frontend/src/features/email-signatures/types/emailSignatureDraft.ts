import type { ImageFieldValue } from "@app-types/media.types";
import type {
  EmailSignatureSocialPlatform,
  EmailSignatureTemplateKey,
} from "@app-types/emailSignature";

export interface EmailSignatureSocialLinkDraft {
  platform: EmailSignatureSocialPlatform;
  url: string;
  label: string;
  // Only used when platform === "WHATSAPP" — a phone number (with country
  // code, digits only) rather than a url.
  phoneNumber: string;
}

export interface EmailSignatureDraft {
  name: string;
  templateKey: EmailSignatureTemplateKey;
  fullName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  ctaText: string;
  ctaUrl: string;
  profileImage: ImageFieldValue;
  companyLogo: ImageFieldValue;
  bannerImage: ImageFieldValue;
  socialLinks: EmailSignatureSocialLinkDraft[];
}
