import type { EmailSignatureSocialPlatform } from "@app-types/emailSignature";

// Mirrors backend/src/modules/email-signatures/email-signatures.constants.ts
export const EMAIL_SIGNATURE_NAME_MAX_LENGTH = 100;
export const EMAIL_SIGNATURE_TEXT_SHORT_MAX_LENGTH = 150;
export const EMAIL_SIGNATURE_TEXT_MEDIUM_MAX_LENGTH = 300;
export const EMAIL_SIGNATURE_MAX_SOCIAL_LINKS = 10;
export const EMAIL_SIGNATURE_SOCIAL_LINK_LABEL_MAX_LENGTH = 60;
export const EMAIL_SIGNATURE_PHONE_DIGITS_REGEX = /^\d{7,15}$/;

// Mirrors backend's EMAIL_SIGNATURE_WHATSAPP_URL_PREFIX — used to parse a
// stored click-to-chat link back into a plain phone number when loading an
// existing signature into the editor (the form always shows a phone
// number for WhatsApp, never the generated url).
export const EMAIL_SIGNATURE_WHATSAPP_URL_PREFIX = "https://wa.me/";

// Debounce for the live preview call as the draft changes — matches
// PLAN_MGMT_SEARCH_DEBOUNCE_MS's precedent (350ms) closely enough to feel
// consistent app-wide.
export const EMAIL_SIGNATURE_PREVIEW_DEBOUNCE_MS = 400;

export const EMAIL_SIGNATURE_BUILDER_STEPS = [
  { id: "template", label: "Template" },
  { id: "content", label: "Content" },
  { id: "cta", label: "Call to action" },
  { id: "social", label: "Social links" },
  { id: "review", label: "Review" },
] as const;

export const EMAIL_SIGNATURE_TEMPLATE_OPTIONS = [
  {
    key: "MODERN",
    label: "Modern",
    description: "Two-column layout with a photo and accent border.",
  },
  {
    key: "CORPORATE",
    label: "Corporate",
    description: "Stacked layout with your logo and labeled contact rows.",
  },
  {
    key: "MINIMAL",
    label: "Minimal",
    description: "A single compact line — name, title, and contact info.",
  },
] as const;

export const EMAIL_SIGNATURE_SOCIAL_PLATFORM_OPTIONS: {
  value: EmailSignatureSocialPlatform;
  label: string;
}[] = [
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "TWITTER", label: "Twitter / X" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "GITHUB", label: "GitHub" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "WEBSITE", label: "Website" },
  { value: "CUSTOM", label: "Custom link" },
];

export interface EmailClientInstructions {
  id: string;
  label: string;
  steps: string[];
}

export const EMAIL_SIGNATURE_CLIENT_INSTRUCTIONS: EmailClientInstructions[] = [
  {
    id: "gmail",
    label: "Gmail",
    steps: [
      "Open Gmail and click the gear icon, then \"See all settings\".",
      "Under the \"General\" tab, scroll to \"Signature\".",
      "Create a new signature and paste (Ctrl/Cmd+V) your copied signature into the box.",
      "Scroll down and click \"Save Changes\".",
    ],
  },
  {
    id: "outlook",
    label: "Outlook",
    steps: [
      "Open Outlook and go to Settings > Mail > Compose and reply.",
      "Under \"Email signature\", create a new signature.",
      "Paste (Ctrl/Cmd+V) your copied signature into the editor.",
      "Set it as your default signature for new messages and replies, then Save.",
    ],
  },
  {
    id: "apple-mail",
    label: "Apple Mail",
    steps: [
      "Open Mail > Settings > Signatures.",
      "Select your account, then click \"+\" to add a new signature.",
      "Paste (Cmd+V) your copied signature into the signature field.",
      "Untick \"Always match my default message font\" so the formatting is preserved.",
    ],
  },
  {
    id: "yahoo-mail",
    label: "Yahoo Mail",
    steps: [
      "Open Settings > More Settings > Writing email.",
      "Turn on \"Signature\" for your account.",
      "Paste (Ctrl/Cmd+V) your copied signature into the box.",
    ],
  },
  {
    id: "thunderbird",
    label: "Thunderbird",
    steps: [
      "Open Account Settings for your account.",
      "Under \"Signature text\", enable \"HTML\" formatting.",
      "Paste (Ctrl/Cmd+V) your copied signature into the box.",
    ],
  },
];
