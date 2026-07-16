export const CUSTOMER_SEARCH_DEBOUNCE_MS = 300;
export const CUSTOMER_SEARCH_PAGE_SIZE = 10;

// A larger batch than the single-select search above (which only needs
// enough rows to browse) — bulk-add is meant to let an admin search a domain
// (e.g. "gmail.com") and select many results at once.
export const BULK_CUSTOMER_PICKER_PAGE_SIZE = 50;
export const BULK_CUSTOMER_PICKER_SEARCH_DEBOUNCE_MS = 350;
