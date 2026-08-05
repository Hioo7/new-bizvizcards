export type EmailSignatureTemplateKey = "MODERN" | "CORPORATE" | "MINIMAL";

export type EmailSignatureSocialPlatform =
  | "LINKEDIN"
  | "TWITTER"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "GITHUB"
  | "YOUTUBE"
  | "TIKTOK"
  | "WHATSAPP"
  | "WEBSITE"
  | "CUSTOM";

export interface EmailSignatureSocialLink {
  platform: EmailSignatureSocialPlatform;
  url: string;
  label: string | null;
}

export interface EmailSignature {
  id: string;
  customerId: string;
  templateKey: EmailSignatureTemplateKey;
  name: string;
  fullName: string;
  jobTitle: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  profileImageMediaId: string | null;
  profileImageUrl: string | null;
  companyLogoMediaId: string | null;
  companyLogoUrl: string | null;
  bannerImageMediaId: string | null;
  bannerImageUrl: string | null;
  socialLinks: EmailSignatureSocialLink[];
  generatedHtml: string;
  createdAt: string;
  updatedAt: string;
}

// ── Wire payload shapes (mirror the backend's Zod-inferred DTOs) ──────────

export type EmailSignatureSocialLinkPayload =
  | {
      platform: Exclude<EmailSignatureSocialPlatform, "CUSTOM" | "WHATSAPP">;
      url: string;
    }
  | { platform: "CUSTOM"; url: string; label: string }
  // Entered as a phone number (with country code, digits only) — the
  // backend generates the click-to-chat wa.me link from it.
  | { platform: "WHATSAPP"; phoneNumber: string };

export type EmailSignatureImageSlotPayload =
  | { action: "upload" }
  | { action: "keep"; mediaId: string };

export interface EmailSignaturePayload {
  name: string;
  templateKey: EmailSignatureTemplateKey;
  fullName: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  ctaText?: string;
  ctaUrl?: string;
  profileImage?: EmailSignatureImageSlotPayload;
  companyLogo?: EmailSignatureImageSlotPayload;
  bannerImage?: EmailSignatureImageSlotPayload;
  socialLinks: EmailSignatureSocialLinkPayload[];
}

export type UpdateEmailSignaturePayload = Partial<EmailSignaturePayload>;

/** One entry per `upload` image slot in a payload, keyed by its field name. */
export interface EmailSignatureImageUpload {
  fieldName: string;
  file: File;
}

export interface EmailSignaturePreviewPayload {
  templateKey: EmailSignatureTemplateKey;
  fullName: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  ctaText?: string;
  ctaUrl?: string;
  profileImageUrl?: string;
  companyLogoUrl?: string;
  bannerImageUrl?: string;
  socialLinks: EmailSignatureSocialLinkPayload[];
}

export interface EmailSignaturePreviewResult {
  html: string;
}
