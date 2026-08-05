import { z } from 'zod';
import {
  EXCHANGE_CONTACT_FIELD_HELP_TEXT_MAX_LENGTH,
  EXCHANGE_CONTACT_FIELD_LABEL_MAX_LENGTH,
  EXCHANGE_CONTACT_FIELD_MAX_OPTIONS,
  EXCHANGE_CONTACT_FIELD_MIN_OPTIONS,
  EXCHANGE_CONTACT_FIELD_OPTION_LABEL_MAX_LENGTH,
  EXCHANGE_CONTACT_FORM_DUPLICATE_TAG_MESSAGE,
  EXCHANGE_CONTACT_FORM_INVALID_BREAK_PLACEMENT_MESSAGE,
  EXCHANGE_CONTACT_FORM_MAX_FIELDS,
  EXCHANGE_CONTACT_FORM_MISSING_NAME_TAG_MESSAGE,
  EXCHANGE_CONTACT_FORM_NAME_FIELD_MUST_BE_REQUIRED_MESSAGE,
} from '../exchange-contact-forms.constants';

const fieldOptionSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1)
      .max(EXCHANGE_CONTACT_FIELD_OPTION_LABEL_MAX_LENGTH),
  })
  .strict();

const fieldBase = {
  label: z.string().trim().min(1).max(EXCHANGE_CONTACT_FIELD_LABEL_MAX_LENGTH),
  helpText: z
    .string()
    .trim()
    .max(EXCHANGE_CONTACT_FIELD_HELP_TEXT_MAX_LENGTH)
    .optional(),
  isRequired: z.boolean(),
};

// SHORT_TEXT is the one type shared between a core field (Name/Company/
// Profession, tag set) and the untagged "Short answer" custom question — see
// EXCHANGE_CONTACT_FIELD_TAG_TYPE.
const shortTextFieldSchema = z
  .object({
    ...fieldBase,
    type: z.literal('SHORT_TEXT'),
    tag: z.enum(['LEAD_NAME', 'LEAD_COMPANY', 'LEAD_PROFESSION']).optional(),
  })
  .strict();

// LONG_TEXT/PHONE/EMAIL/LOCATION are core-only in the launch field set — no
// untagged custom equivalent exists, so their tag is fixed, not optional.
const longTextFieldSchema = z
  .object({
    ...fieldBase,
    type: z.literal('LONG_TEXT'),
    tag: z.literal('LEAD_NOTE'),
  })
  .strict();

const phoneFieldSchema = z
  .object({
    ...fieldBase,
    type: z.literal('PHONE'),
    tag: z.literal('LEAD_PHONE'),
  })
  .strict();

const emailFieldSchema = z
  .object({
    ...fieldBase,
    type: z.literal('EMAIL'),
    tag: z.literal('LEAD_EMAIL'),
  })
  .strict();

const locationFieldSchema = z
  .object({
    ...fieldBase,
    type: z.literal('LOCATION'),
    tag: z.literal('LEAD_LOCATION'),
  })
  .strict();

// MULTIPLE_CHOICE/DROPDOWN/DATE are custom-question-only — no core tag exists
// for any of them, and `tag` is declared (as always-undefined) rather than
// omitted so every variant in the union exposes the same `tag` property,
// letting callers read `field.tag` without first narrowing on `type`.
const multipleChoiceFieldSchema = z
  .object({
    ...fieldBase,
    type: z.literal('MULTIPLE_CHOICE'),
    tag: z.undefined().optional(),
    options: z
      .array(fieldOptionSchema)
      .min(EXCHANGE_CONTACT_FIELD_MIN_OPTIONS)
      .max(EXCHANGE_CONTACT_FIELD_MAX_OPTIONS),
  })
  .strict();

const dropdownFieldSchema = z
  .object({
    ...fieldBase,
    type: z.literal('DROPDOWN'),
    tag: z.undefined().optional(),
    options: z
      .array(fieldOptionSchema)
      .min(EXCHANGE_CONTACT_FIELD_MIN_OPTIONS)
      .max(EXCHANGE_CONTACT_FIELD_MAX_OPTIONS),
  })
  .strict();

const dateFieldSchema = z
  .object({
    ...fieldBase,
    type: z.literal('DATE'),
    tag: z.undefined().optional(),
  })
  .strict();

// A structural marker, not a question — splits the form into sequential
// stages for public rendering. Deliberately excludes `fieldBase` (no
// label/helpText/isRequired): there's no question to ask, so no meaningless
// display text to invent. ExchangeContactFormsService writes fixed
// empty/false values for those columns instead of reading them from here.
const breakFieldSchema = z
  .object({
    type: z.literal('BREAK'),
    tag: z.undefined().optional(),
  })
  .strict();

export const exchangeContactFormFieldSchema = z.discriminatedUnion('type', [
  shortTextFieldSchema,
  longTextFieldSchema,
  phoneFieldSchema,
  emailFieldSchema,
  locationFieldSchema,
  multipleChoiceFieldSchema,
  dropdownFieldSchema,
  dateFieldSchema,
  breakFieldSchema,
]);

export type ExchangeContactFormFieldDto = z.infer<
  typeof exchangeContactFormFieldSchema
>;

// Shared by create/update — every save (mutate-in-place or forked into a new
// version, see ExchangeContactFormsService) validates the whole incoming
// field list against these two form-wide invariants, since Lead.name is
// non-nullable and a tag may only route one field's answer into it.
export const exchangeContactFormFieldsSchema = z
  .array(exchangeContactFormFieldSchema)
  .min(1)
  .max(EXCHANGE_CONTACT_FORM_MAX_FIELDS)
  .refine(
    (fields) =>
      fields.filter((field) => field.tag === 'LEAD_NAME').length === 1,
    { message: EXCHANGE_CONTACT_FORM_MISSING_NAME_TAG_MESSAGE },
  )
  .refine(
    (fields) => {
      const nameField = fields.find((field) => field.tag === 'LEAD_NAME');
      // Lead.name is non-nullable at the DB level — a Name field that's
      // present but not required would let a submission through with no
      // value to write there. The "exactly one Name field" refine above
      // already guarantees nameField exists whenever this matters; when it
      // doesn't (zero or two), that refine's own message is what surfaces.
      // The `type !== 'BREAK'` check is purely to satisfy TS narrowing
      // (BREAK's tag is always undefined, so nameField can never actually
      // be one) — never a real code path.
      return !nameField || nameField.type === 'BREAK' || nameField.isRequired;
    },
    { message: EXCHANGE_CONTACT_FORM_NAME_FIELD_MUST_BE_REQUIRED_MESSAGE },
  )
  .refine(
    (fields) => {
      const tags = fields
        .map((field) => field.tag)
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));
      return new Set(tags).size === tags.length;
    },
    { message: EXCHANGE_CONTACT_FORM_DUPLICATE_TAG_MESSAGE },
  )
  // A BREAK must have a real (non-BREAK, non-LOCATION) field directly
  // before and after it. This single adjacency rule captures every case:
  // no leading break (no fields[-1]), no trailing break (no fields[n]), no
  // two consecutive breaks (an adjacent break isn't a "real" neighbor), and
  // no break touching Location — which always renders as its own dedicated
  // final stage regardless of where in this order it sits, so a break
  // beside it would always be structurally redundant/misleading.
  .refine(
    (fields) =>
      fields.every((field, index) => {
        if (field.type !== 'BREAK') return true;
        const isRealNeighbor = (f: (typeof fields)[number] | undefined) =>
          f !== undefined && f.type !== 'BREAK' && f.type !== 'LOCATION';
        return (
          isRealNeighbor(fields[index - 1]) && isRealNeighbor(fields[index + 1])
        );
      }),
    { message: EXCHANGE_CONTACT_FORM_INVALID_BREAK_PLACEMENT_MESSAGE },
  );
