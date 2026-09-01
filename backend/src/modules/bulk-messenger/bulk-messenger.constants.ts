// Fixed values for the Bulk Messenger feature. Env-configurable values do not
// belong here — this feature has none (no provider, no delivery).

// ── size limits ──────────────────────────────────────────────────────────────
export const BULK_MESSAGE_TEMPLATE_NAME_MAX_LENGTH = 100;
export const BULK_MESSAGE_TEMPLATE_BODY_MAX_LENGTH = 2000;
// Upper bound on recipients selected for a single send — a sanity guardrail,
// not a product-mandated ceiling.
export const BULK_MESSAGE_SEND_MAX_RECIPIENTS = 1000;

// ── placeholder tokens ───────────────────────────────────────────────────────
// A placeholder looks like `{name}` or `{field.company_size}` — lowercase
// letters, digits, underscore and dot only. Matched case-insensitively so a
// customer typing `{Name}` still resolves. Callers must build a fresh RegExp
// (the `g` flag makes RegExp objects stateful) via createPlaceholderRegExp().
export const BULK_MESSAGE_PLACEHOLDER_PATTERN_SOURCE = '\\{([a-z0-9_.]+)\\}';

export function createPlaceholderRegExp(): RegExp {
  return new RegExp(BULK_MESSAGE_PLACEHOLDER_PATTERN_SOURCE, 'gi');
}

// Namespace prefix for a token derived from a linked form's custom field.
export const BULK_MESSAGE_FORM_PLACEHOLDER_PREFIX = 'field.';

// The lead scalar fields exposed to a template body as core placeholders.
// Location lat/long, stage and timestamps are deliberately excluded.
export interface BulkMessageLeadCoreFields {
  name: string;
  email: string | null;
  countryDialCode: string | null;
  phoneNumber: string | null;
  company: string | null;
  profession: string | null;
  note: string | null;
  location: string | null;
}

export interface BulkMessageCorePlaceholder {
  token: string;
  label: string;
  resolve: (lead: BulkMessageLeadCoreFields) => string;
}

export const BULK_MESSAGE_CORE_PLACEHOLDERS: readonly BulkMessageCorePlaceholder[] =
  [
    { token: 'name', label: 'Name', resolve: (lead) => lead.name || '' },
    { token: 'email', label: 'Email', resolve: (lead) => lead.email || '' },
    {
      token: 'phone',
      label: 'Phone',
      resolve: (lead) =>
        `${lead.countryDialCode ?? ''} ${lead.phoneNumber ?? ''}`.trim(),
    },
    {
      token: 'company',
      label: 'Company',
      resolve: (lead) => lead.company || '',
    },
    {
      token: 'profession',
      label: 'Profession',
      resolve: (lead) => lead.profession || '',
    },
    { token: 'note', label: 'Note', resolve: (lead) => lead.note || '' },
    {
      token: 'location',
      label: 'Location',
      resolve: (lead) => lead.location || '',
    },
  ];

// ── messages ─────────────────────────────────────────────────────────────────
export const BULK_MESSAGE_TEMPLATE_NOT_FOUND_MESSAGE =
  'Bulk message template not found';
export const BULK_MESSAGE_SEND_NOT_FOUND_MESSAGE =
  'Bulk message send not found';
export const BULK_MESSAGE_SEND_RECIPIENT_NOT_FOUND_MESSAGE =
  'Bulk message send recipient not found';
export const BULK_MESSAGE_TEMPLATE_LINKED_FORM_NOT_FOUND_MESSAGE =
  'The selected exchange contact form was not found';
export const BULK_MESSAGE_UNKNOWN_PLACEHOLDER_MESSAGE =
  'The message uses placeholders that are not available for this template';
export const BULK_MESSAGE_BODY_REQUIRED_ON_FORM_CHANGE_MESSAGE =
  'The message must be re-entered when the linked form changes';
export const BULK_MESSAGE_SEND_INVALID_RECIPIENT_MESSAGE =
  'One or more selected recipients are not valid for this template';
export const BULK_MESSAGE_SEND_NO_RECIPIENTS_MESSAGE =
  'Select at least one recipient';
