import { EmailSignatureSocialPlatform } from '../../generated/prisma/client';

export const EMAIL_SIGNATURE_NAME_MAX_LENGTH = 100;
export const EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH = 150;
export const EMAIL_SIGNATURE_TEXT_MEDIUM_MAX_LENGTH = 300;
export const EMAIL_SIGNATURE_URL_MAX_LENGTH = 2048;
export const EMAIL_SIGNATURE_SOCIAL_LINK_LABEL_MAX_LENGTH = 60;
export const EMAIL_SIGNATURE_MAX_SOCIAL_LINKS = 10;

export const EMAIL_SIGNATURE_PHONE_NUMBER_MIN_DIGITS = 7;
export const EMAIL_SIGNATURE_PHONE_NUMBER_MAX_DIGITS = 15;
export const EMAIL_SIGNATURE_PHONE_NUMBER_DIGITS_REGEX = /^\d+$/;

export const EMAIL_SIGNATURE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const EMAIL_SIGNATURE_IMAGE_ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
];
export const EMAIL_SIGNATURE_IMAGE_ALLOWED_MIME_TYPE_PATTERN =
  /^image\/(jpeg|png|webp)$/;

export const EMAIL_SIGNATURE_MULTIPART_DATA_FIELD = 'data';
export const EMAIL_SIGNATURE_PROFILE_IMAGE_FIELD = 'profileImage';
export const EMAIL_SIGNATURE_COMPANY_LOGO_FIELD = 'companyLogo';
export const EMAIL_SIGNATURE_BANNER_IMAGE_FIELD = 'bannerImage';

export const EMAIL_SIGNATURE_STORAGE_KEY_PREFIX = 'email-signatures';

// Fixed, seeded storage keys for the small set of social-platform brand icon
// assets embedded inline in the exported signature HTML — not customer
// content, so these bypass the Media/MinIO upload pipeline entirely (see
// seed-email-signature-icons.ts) and are resolved via
// MediaService.getPublicUrlForKey(), the same pattern used for the default
// OG-preview fallback image. CUSTOM deliberately has no icon.
export const EMAIL_SIGNATURE_SOCIAL_ICON_STORAGE_KEY: Partial<
  Record<EmailSignatureSocialPlatform, string>
> = {
  LINKEDIN: 'defaults/email-signature-icons/linkedin.png',
  TWITTER: 'defaults/email-signature-icons/twitter.png',
  FACEBOOK: 'defaults/email-signature-icons/facebook.png',
  INSTAGRAM: 'defaults/email-signature-icons/instagram.png',
  GITHUB: 'defaults/email-signature-icons/github.png',
  YOUTUBE: 'defaults/email-signature-icons/youtube.png',
  TIKTOK: 'defaults/email-signature-icons/tiktok.png',
  WHATSAPP: 'defaults/email-signature-icons/whatsapp.png',
  WEBSITE: 'defaults/email-signature-icons/website.png',
};

export const EMAIL_SIGNATURE_SOCIAL_ICON_SIZE_PX = 20;

// Human-readable fallback text used when a platform has no icon image to
// show (currently only CUSTOM, which has no brand icon at all).
export const EMAIL_SIGNATURE_SOCIAL_PLATFORM_LABEL: Record<
  EmailSignatureSocialPlatform,
  string
> = {
  LINKEDIN: 'LinkedIn',
  TWITTER: 'Twitter / X',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  GITHUB: 'GitHub',
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  WHATSAPP: 'WhatsApp',
  WEBSITE: 'Website',
  CUSTOM: 'Link',
};

// WhatsApp is entered as a phone number (with country code, digits only —
// same shape as the signature's own top-level `phone` field) rather than a
// URL — the click-to-chat link is generated from it, never typed directly.
export const EMAIL_SIGNATURE_WHATSAPP_PHONE_MIN_DIGITS =
  EMAIL_SIGNATURE_PHONE_NUMBER_MIN_DIGITS;
export const EMAIL_SIGNATURE_WHATSAPP_PHONE_MAX_DIGITS =
  EMAIL_SIGNATURE_PHONE_NUMBER_MAX_DIGITS;
export const EMAIL_SIGNATURE_WHATSAPP_PHONE_DIGITS_REGEX =
  EMAIL_SIGNATURE_PHONE_NUMBER_DIGITS_REGEX;
export const EMAIL_SIGNATURE_WHATSAPP_URL_PREFIX = 'https://wa.me/';

export function buildEmailSignatureWhatsAppUrl(phoneNumber: string): string {
  return `${EMAIL_SIGNATURE_WHATSAPP_URL_PREFIX}${phoneNumber}`;
}

export const EMAIL_SIGNATURE_NOT_FOUND_MESSAGE = 'Email signature not found';
