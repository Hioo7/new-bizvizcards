export const REDIRECT_SOURCE_PATH_MAX_LENGTH = 500;
export const REDIRECT_TARGET_PATH_MAX_LENGTH = 500;
export const REDIRECT_DESTINATION_URL_MAX_LENGTH = 2048;
export const REDIRECT_RESTRICTED_PATH_MAX_LENGTH = 500;

// Must start with "/" and contain no whitespace, mirroring the backend's validation.
export const REDIRECT_PATH_REGEX = /^\/\S*$/;

export const REDIRECT_TABS = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
  { value: "restricted", label: "Restricted paths" },
] as const;

export type RedirectTab = (typeof REDIRECT_TABS)[number]["value"];
