import type {
  ExchangeContactFieldTag,
  ExchangeContactFieldType,
} from '../../generated/prisma/client';

export const EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH = 150;
export const EXCHANGE_CONTACT_FIELD_LABEL_MAX_LENGTH = 200;
export const EXCHANGE_CONTACT_FIELD_HELP_TEXT_MAX_LENGTH = 300;
export const EXCHANGE_CONTACT_FIELD_OPTION_LABEL_MAX_LENGTH = 150;
export const EXCHANGE_CONTACT_FORM_MAX_FIELDS = 30;
export const EXCHANGE_CONTACT_FIELD_MIN_OPTIONS = 2;
export const EXCHANGE_CONTACT_FIELD_MAX_OPTIONS = 20;

// Submitted-answer value bounds for SHORT_TEXT/LONG_TEXT, applied uniformly
// whether the field is tagged (LEAD_NAME/LEAD_COMPANY/LEAD_PROFESSION/
// LEAD_NOTE) or an untagged custom question — deliberately matching
// leads.constants.ts's LEAD_NAME_MAX_LENGTH/LEAD_COMPANY_MAX_LENGTH/
// LEAD_PROFESSION_MAX_LENGTH (all 150) and LEAD_NOTE_MAX_LENGTH (2000), so a
// tagged answer can never be rejected by Lead's own column validation after
// already passing here.
export const EXCHANGE_CONTACT_ANSWER_SHORT_TEXT_MAX_LENGTH = 150;
export const EXCHANGE_CONTACT_ANSWER_LONG_TEXT_MAX_LENGTH = 2000;

export const EXCHANGE_CONTACT_FORM_LIST_DEFAULT_PAGE = 1;
export const EXCHANGE_CONTACT_FORM_LIST_DEFAULT_PAGE_SIZE = 20;
export const EXCHANGE_CONTACT_FORM_LIST_MAX_PAGE_SIZE = 100;

// Which tag(s) a given field type may carry. Also expressed independently at
// the Zod layer (each discriminated-union variant fixes its own literal tag
// or omits the property) — this table is the single source of truth reused
// by the tag-mapping util and mirrored by the frontend builder config, not a
// runtime validation gate in its own right.
export const EXCHANGE_CONTACT_FIELD_TAG_TYPE: Record<
  ExchangeContactFieldTag,
  ExchangeContactFieldType
> = {
  LEAD_NAME: 'SHORT_TEXT',
  LEAD_COMPANY: 'SHORT_TEXT',
  LEAD_PROFESSION: 'SHORT_TEXT',
  LEAD_NOTE: 'LONG_TEXT',
  LEAD_PHONE: 'PHONE',
  LEAD_EMAIL: 'EMAIL',
  LEAD_LOCATION: 'LOCATION',
};

export const EXCHANGE_CONTACT_FORM_NOT_FOUND_MESSAGE =
  'Exchange contact form not found';
export const EXCHANGE_CONTACT_FORM_VERSION_NOT_FOUND_MESSAGE =
  'Exchange contact form version not found';
export const EXCHANGE_CONTACT_FORM_MISSING_NAME_TAG_MESSAGE =
  'The form must include exactly one Name field';
export const EXCHANGE_CONTACT_FORM_NAME_FIELD_MUST_BE_REQUIRED_MESSAGE =
  'The Name field must be marked required';
export const EXCHANGE_CONTACT_FORM_DUPLICATE_TAG_MESSAGE =
  'Each core field tag may only be used once per form';
export const EXCHANGE_CONTACT_FORM_INVALID_BREAK_PLACEMENT_MESSAGE =
  'A break must have a real field directly before and after it, and cannot sit next to the Location field';
export const EXCHANGE_CONTACT_FORM_VERSION_DELETE_HAS_SUBMISSIONS_MESSAGE =
  'This version cannot be deleted because it already has submissions';
export const EXCHANGE_CONTACT_FORM_VERSION_DELETE_CURRENT_MESSAGE =
  'The current version cannot be deleted on its own — delete the whole form instead';
export const EXCHANGE_CONTACT_FORM_DELETE_HAS_SUBMISSIONS_MESSAGE =
  'This form cannot be deleted because one or more of its versions already has submissions';
export const EXCHANGE_CONTACT_FORM_ECARD_OWNERSHIP_MISMATCH_MESSAGE =
  'One or more e-cards do not belong to this form’s customer';
export const EXCHANGE_CONTACT_FORM_ORGANISATION_TEMPLATE_NOT_FOUND_MESSAGE =
  'This organisation has no exchange contact form template';
export const EXCHANGE_CONTACT_FORM_SUBMISSION_VERSION_STALE_MESSAGE =
  'This form has changed — please refresh and try again';
export const EXCHANGE_CONTACT_FORM_SUBMISSION_UNKNOWN_FIELD_MESSAGE =
  'Submission includes an answer for a field that is not part of this form';
export const EXCHANGE_CONTACT_FORM_SUBMISSION_MISSING_REQUIRED_MESSAGE =
  'A required field is missing an answer';
export const EXCHANGE_CONTACT_FORM_SUBMISSION_TYPE_MISMATCH_MESSAGE =
  'An answer does not match its field’s type';
export const EXCHANGE_CONTACT_FORM_SUBMISSION_INVALID_OPTION_MESSAGE =
  'An answer selects an option that does not belong to its field';
export const EXCHANGE_CONTACT_FORM_SUBMISSION_DUPLICATE_ANSWER_MESSAGE =
  'Submission includes more than one answer for the same field';
