import {
  BULK_MESSAGE_CORE_PLACEHOLDERS,
  BULK_MESSAGE_FORM_PLACEHOLDER_PREFIX,
  BulkMessageLeadCoreFields,
  createPlaceholderRegExp,
} from '../bulk-messenger.constants';

export interface ResolveBulkMessagePlaceholdersInput {
  body: string;
  lead: BulkMessageLeadCoreFields;
  // Custom (untagged) form-field answers, keyed by the field's placeholder
  // slug (without the `field.` prefix), pre-stringified by the caller.
  formAnswerValueBySlug: Map<string, string>;
}

// Pure. Substitutes every `{token}` in `body` with its resolved value; a token
// that has no value — a missing lead field, an unanswered form question, or a
// typo — collapses to an empty string, never left as a literal `{token}`.
export function resolveBulkMessagePlaceholders(
  input: ResolveBulkMessagePlaceholdersInput,
): string {
  const values = new Map<string, string>();

  for (const placeholder of BULK_MESSAGE_CORE_PLACEHOLDERS) {
    values.set(placeholder.token, placeholder.resolve(input.lead));
  }
  for (const [slug, value] of input.formAnswerValueBySlug) {
    values.set(`${BULK_MESSAGE_FORM_PLACEHOLDER_PREFIX}${slug}`, value);
  }

  return input.body.replace(
    createPlaceholderRegExp(),
    (_match, token: string) => values.get(token.toLowerCase()) ?? '',
  );
}

// Unique, lowercased tokens referenced by a template body.
export function extractPlaceholderTokens(body: string): string[] {
  const tokens = new Set<string>();
  for (const match of body.matchAll(createPlaceholderRegExp())) {
    tokens.add(match[1].toLowerCase());
  }
  return [...tokens];
}

// Tokens in `body` that are not in `availableTokens` (all lowercase).
export function findUnknownPlaceholderTokens(
  body: string,
  availableTokens: ReadonlySet<string>,
): string[] {
  return extractPlaceholderTokens(body).filter(
    (token) => !availableTokens.has(token),
  );
}
