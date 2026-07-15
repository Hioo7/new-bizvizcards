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

// Used by the databaseHooks.session.create.before ban check in
// customer-auth.factory.ts. Customer auth has no admin plugin (unlike
// employee auth), so ban enforcement is hand-rolled here rather than reusing
// the plugin's own messaging.
export const CUSTOMER_BANNED_MESSAGE =
  'This account has been suspended. Please contact support if you believe this is an error.';

// better-auth's own local-auth code (sign-up/sign-in/update-user) uses this
// literal providerId for every email+password credential row it creates —
// reused here (customers.service.ts) when hand-writing a CustomerCredential
// row outside of better-auth's own account-linking flow.
export const CREDENTIAL_PROVIDER_ID = 'credential';
