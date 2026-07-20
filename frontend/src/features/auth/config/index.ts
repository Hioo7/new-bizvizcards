export const MIN_NAME_LENGTH = 2;
export const ERROR_RIBBON_DURATION_MS = 4000;

export const INVALID_CREDENTIALS_MESSAGE =
  "Invalid email or password. Please try again.";
export const GENERIC_LOGIN_ERROR_MESSAGE = "Login failed. Please try again.";
export const GENERIC_SIGNUP_ERROR_MESSAGE =
  "Sign up failed. Please try again.";
export const GENERIC_SOCIAL_SIGNIN_ERROR_MESSAGE =
  "Couldn't start sign-in. Please try again.";

// Flip once real Apple OAuth credentials are configured on the backend — the
// button itself and its click handler are otherwise fully wired already
// (see SocialLoginButtons.tsx), this just keeps it presented as disabled
// until then.
export const IS_APPLE_SIGNIN_ENABLED = false;
export const APPLE_SIGNIN_COMING_SOON_MESSAGE = "Apple sign-in coming soon";
