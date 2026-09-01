// Fixed values for the Bulk Messenger feature UI. Length caps mirror
// backend/src/modules/bulk-messenger/bulk-messenger.constants.ts (frontend and
// backend constants aren't shared across the repo).

export const TEMPLATE_BUILDER_STEPS = [
  { id: "basics", label: "Basics" },
  { id: "body", label: "Message" },
  { id: "review", label: "Review" },
] as const;

export const SEND_WIZARD_STEPS = [
  { id: "template", label: "Template" },
  { id: "recipients", label: "Recipients" },
  { id: "review", label: "Review" },
] as const;

export const BULK_MESSAGE_TEMPLATE_NAME_MAX_LENGTH = 100;
export const BULK_MESSAGE_TEMPLATE_BODY_MAX_LENGTH = 2000;

export const BULK_MESSENGER_TABS = [
  { id: "templates", label: "Templates" },
  { id: "sends", label: "Sends" },
] as const;

export type BulkMessengerTabId = (typeof BULK_MESSENGER_TABS)[number]["id"];

export const WA_ME_BASE_URL = "https://wa.me/";

// Matches `{name}` / `{field.company_size}` — see the backend's
// BULK_MESSAGE_PLACEHOLDER_PATTERN_SOURCE. Build a fresh RegExp per use (the
// `g` flag makes RegExp objects stateful).
export const BULK_MESSAGE_PLACEHOLDER_PATTERN_SOURCE = "\\{([a-z0-9_.]+)\\}";
