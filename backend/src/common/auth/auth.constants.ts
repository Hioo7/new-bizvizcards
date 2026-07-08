export const EMPLOYEE_AUTH = Symbol('EMPLOYEE_AUTH');
export const CUSTOMER_AUTH = Symbol('CUSTOMER_AUTH');

export const EMPLOYEE_AUTH_BASE_PATH = '/api/auth/staff';
export const CUSTOMER_AUTH_BASE_PATH = '/api/auth/customers';

export const EMPLOYEE_AUTH_COOKIE_PREFIX = 'staff';
export const CUSTOMER_AUTH_COOKIE_PREFIX = 'customer';

// Retry policy for linking a newly created auth account row (CustomerAccount/
// EmployeeAccount) to its business-model row (Customer/Employee) in the
// databaseHooks.user.create.after hook. See link-account-with-retry.ts.
export const ACCOUNT_LINK_MAX_ATTEMPTS = 3;
export const ACCOUNT_LINK_RETRY_DELAY_MS = 200;
