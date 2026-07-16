export const CUSTOMER_MGMT_LIST_PAGE_SIZE = 20;
export const CUSTOMER_MGMT_SEARCH_DEBOUNCE_MS = 350;
export const CUSTOMER_MGMT_NAME_MAX_LENGTH = 120;
export const CUSTOMER_MGMT_BAN_REASON_MAX_LENGTH = 500;

export const ORGANISATION_MGMT_LIST_PAGE_SIZE = 20;
export const ORGANISATION_MGMT_SEARCH_DEBOUNCE_MS = 350;
export const ORGANISATION_MGMT_NAME_MAX_LENGTH = 150;

// Mirrors the backend's ORGANISATION_BULK_ADD_MEMBERS_MAX_PER_REQUEST cap —
// kept here since frontend/backend constants aren't shared across the repo.
export const BULK_ADD_MEMBERS_MAX_PER_REQUEST = 100;
