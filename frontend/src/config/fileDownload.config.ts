// Delay before revoking a blob object URL used for a synthetic download —
// gives the browser enough time to actually start the download from the
// URL before it's invalidated.
export const BLOB_DOWNLOAD_REVOKE_DELAY_MS = 10_000;
