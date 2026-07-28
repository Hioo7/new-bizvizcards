import { ApiError } from "@services/apiClient";

interface ApiFieldError {
  field: string;
  message: string;
}

function isApiFieldErrorArray(value: unknown): value is ApiFieldError[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item): item is ApiFieldError =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as ApiFieldError).field === "string" &&
        typeof (item as ApiFieldError).message === "string",
    )
  );
}

/** Reads the structured per-field validation errors the backend attaches to a failed
 * request (see backend's `formatZodError`), keyed by field name — or null if the
 * error carries no such detail (e.g. a network failure or a plain-string error). */
export function getFieldErrorMap(error: unknown): Record<string, string> | null {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== "object") {
    return null;
  }
  const fieldErrors = (error.data as { fieldErrors?: unknown }).fieldErrors;
  if (!isApiFieldErrorArray(fieldErrors) || fieldErrors.length === 0) return null;

  return Object.fromEntries(fieldErrors.map(({ field, message }) => [field, message]));
}
