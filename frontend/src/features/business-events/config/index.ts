// Mirrors backend/src/modules/business-events/business-events.constants.ts —
// kept here since frontend/backend constants aren't shared across the repo.
export const EVENT_MGMT_LIST_PAGE_SIZE = 20;
export const EVENT_MGMT_SEARCH_DEBOUNCE_MS = 350;
export const EVENT_NAME_MAX_LENGTH = 200;
export const EVENT_DESCRIPTION_MAX_LENGTH = 2000;
export const EVENT_LOCATION_MAX_LENGTH = 300;
export const EVENT_TRACKABLE_NAME_MAX_LENGTH = 150;
export const EVENT_TRACKABLE_DESCRIPTION_MAX_LENGTH = 1000;

export const EVENT_FORM_STEPS_CREATE = [
  { id: "host", label: "Host" },
  { id: "details", label: "Details" },
] as const;

export const EVENT_FORM_STEPS_EDIT = [
  { id: "details", label: "Details" },
] as const;
