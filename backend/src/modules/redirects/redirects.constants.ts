export const REDIRECT_SOURCE_PATH_MAX_LENGTH = 500;
export const REDIRECT_TARGET_PATH_MAX_LENGTH = 500;
export const REDIRECT_DESTINATION_URL_MAX_LENGTH = 2048;
export const REDIRECT_RESTRICTED_PATH_MAX_LENGTH = 500;

// Must start with "/" and contain no whitespace — mirrors the internal-path
// shape the legacy app accepted (an app-relative path, never a full URL).
export const REDIRECT_PATH_REGEX = /^\/\S*$/;

export const REDIRECT_HTTP_STATUS = 307;

export const REDIRECT_RESOLVE_QUERY_KEY = 'path';

/** Strips a trailing slash (except for the root path "/"), mirroring the legacy proxy's normalization. */
export function normalizeRedirectPath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
}
