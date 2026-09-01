import { BULK_MESSAGE_PLACEHOLDER_PATTERN_SOURCE } from "@features/bulk-messenger/config/bulkMessenger.config";

// Unique, lowercased `{token}` names referenced by a message body.
export function parseBodyTokens(body: string): string[] {
  const pattern = new RegExp(BULK_MESSAGE_PLACEHOLDER_PATTERN_SOURCE, "gi");
  const tokens = new Set<string>();
  for (const match of body.matchAll(pattern)) {
    tokens.add(match[1].toLowerCase());
  }
  return [...tokens];
}

export function findUnknownTokens(
  body: string,
  availableTokens: ReadonlySet<string>,
): string[] {
  return parseBodyTokens(body).filter((token) => !availableTokens.has(token));
}

// Inserts `{token}` into `value` replacing the [start, end) selection; returns
// the new value and the caret position to place after it.
export function insertTokenAtCursor(
  value: string,
  start: number,
  end: number,
  token: string,
): { value: string; caret: number } {
  const inserted = `{${token}}`;
  return {
    value: value.slice(0, start) + inserted + value.slice(end),
    caret: start + inserted.length,
  };
}
