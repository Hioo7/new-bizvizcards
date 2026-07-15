export const CUSTOMER_MGMT_LIST_PAGE_SIZE = 20;
export const CUSTOMER_MGMT_SEARCH_DEBOUNCE_MS = 350;
export const CUSTOMER_MGMT_NAME_MAX_LENGTH = 120;
export const CUSTOMER_MGMT_BAN_REASON_MAX_LENGTH = 500;

export const ORGANISATION_MGMT_LIST_PAGE_SIZE = 20;
export const ORGANISATION_MGMT_SEARCH_DEBOUNCE_MS = 350;
export const ORGANISATION_MGMT_NAME_MAX_LENGTH = 150;

// A larger batch than the single-select CustomerPickerField's search (which
// only needs enough rows to browse) — bulk-add is meant to let an admin
// search a domain (e.g. "gmail.com") and select many results at once.
export const BULK_CUSTOMER_PICKER_PAGE_SIZE = 50;
export const BULK_CUSTOMER_PICKER_SEARCH_DEBOUNCE_MS = 350;
// Mirrors the backend's ORGANISATION_BULK_ADD_MEMBERS_MAX_PER_REQUEST cap —
// kept here since frontend/backend constants aren't shared across the repo.
export const BULK_ADD_MEMBERS_MAX_PER_REQUEST = 100;
