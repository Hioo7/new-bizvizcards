export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Shape the backend attaches to a failed Zod validation — see backend's
// formatZodError. Exported so utils/apiFieldErrors.ts (per-field inline
// error display) can reuse the same shape instead of redefining it.
export interface ApiFieldError {
  field: string;
  message: string;
}

export function isApiFieldError(value: unknown): value is ApiFieldError {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).field === "string" &&
    typeof (value as Record<string, unknown>).message === "string"
  );
}

// Mirrors the backend's own humanizeFieldLabel (zod-error-formatter.ts) —
// turns a dotted path like "fields.2.label" into just "Label".
function humanizeFieldLabel(field: string): string {
  const lastSegment = field.split(".").pop() ?? field;
  const spaced = lastSegment.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// A failed Zod validation returns a generic top-level `message` (e.g.
// "Validation failed") plus a `fieldErrors` array with the actual, specific
// reason (see backend's zod-error-formatter.ts) — that specific reason is
// what a user needs to fix the problem, so it takes priority whenever
// present. A "(root)" field means the failure applies to the whole payload
// (e.g. a cross-field rule), so its message already reads as a complete,
// standalone sentence and isn't prefixed with a field name.
function extractErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.fieldErrors) && record.fieldErrors.length > 0) {
      const fieldErrors = record.fieldErrors.filter(isApiFieldError);
      if (fieldErrors.length > 0) {
        return fieldErrors
          .map((fieldError) =>
            fieldError.field === "(root)"
              ? fieldError.message
              : `${humanizeFieldLabel(fieldError.field)}: ${fieldError.message}`,
          )
          .join(" ");
      }
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }
  return fallback;
}

export async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const isFormData = init?.body instanceof FormData;

  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractErrorMessage(data, response.statusText),
      data,
    );
  }

  return data as TResponse;
}
