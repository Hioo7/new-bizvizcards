import { z } from 'zod';
import {
  LEAD_EMAIL_MAX_LENGTH,
  LEAD_EMAIL_REGEX,
  LEAD_LOCATION_LATITUDE_MAX,
  LEAD_LOCATION_LATITUDE_MIN,
  LEAD_LOCATION_LONGITUDE_MAX,
  LEAD_LOCATION_LONGITUDE_MIN,
  LEAD_NOTE_MAX_LENGTH,
  LEAD_PHONE_DIAL_CODE_MAX_LENGTH,
  LEAD_PHONE_NUMBER_DIGITS_REGEX,
  LEAD_PHONE_NUMBER_MAX_DIGITS,
  LEAD_PHONE_NUMBER_MIN_DIGITS,
} from '../../leads/leads.constants';
import { EXCHANGE_CONTACT_ANSWER_SHORT_TEXT_MAX_LENGTH } from '../exchange-contact-forms.constants';

// One entry per *answered* field only — a visitor leaving an optional field
// blank simply omits it here; required-field presence, tag mapping, and
// cross-checking each fieldId/type pair against the actually-resolved form
// version happen server-side (ExchangeContactFormSubmissionService), never
// trusted from the client alone.
const answerBase = { fieldId: z.uuid() };

const shortTextAnswerSchema = z
  .object({
    ...answerBase,
    type: z.literal('SHORT_TEXT'),
    value: z
      .string()
      .trim()
      .min(1)
      .max(EXCHANGE_CONTACT_ANSWER_SHORT_TEXT_MAX_LENGTH),
  })
  .strict();

const longTextAnswerSchema = z
  .object({
    ...answerBase,
    type: z.literal('LONG_TEXT'),
    value: z.string().trim().min(1).max(LEAD_NOTE_MAX_LENGTH),
  })
  .strict();

const emailAnswerSchema = z
  .object({
    ...answerBase,
    type: z.literal('EMAIL'),
    value: z.string().trim().max(LEAD_EMAIL_MAX_LENGTH).regex(LEAD_EMAIL_REGEX),
  })
  .strict();

const phoneAnswerSchema = z
  .object({
    ...answerBase,
    type: z.literal('PHONE'),
    countryDialCode: z
      .string()
      .trim()
      .min(1)
      .max(LEAD_PHONE_DIAL_CODE_MAX_LENGTH),
    phoneNumber: z
      .string()
      .trim()
      .regex(LEAD_PHONE_NUMBER_DIGITS_REGEX)
      .min(LEAD_PHONE_NUMBER_MIN_DIGITS)
      .max(LEAD_PHONE_NUMBER_MAX_DIGITS),
  })
  .strict();

const locationAnswerSchema = z
  .object({
    ...answerBase,
    type: z.literal('LOCATION'),
    latitude: z
      .number()
      .min(LEAD_LOCATION_LATITUDE_MIN)
      .max(LEAD_LOCATION_LATITUDE_MAX),
    longitude: z
      .number()
      .min(LEAD_LOCATION_LONGITUDE_MIN)
      .max(LEAD_LOCATION_LONGITUDE_MAX),
  })
  .strict();

const multipleChoiceAnswerSchema = z
  .object({
    ...answerBase,
    type: z.literal('MULTIPLE_CHOICE'),
    optionId: z.uuid(),
  })
  .strict();

const dropdownAnswerSchema = z
  .object({
    ...answerBase,
    type: z.literal('DROPDOWN'),
    optionId: z.uuid(),
  })
  .strict();

const dateAnswerSchema = z
  .object({
    ...answerBase,
    type: z.literal('DATE'),
    value: z.coerce.date(),
  })
  .strict();

export const exchangeContactFormAnswerSchema = z.discriminatedUnion('type', [
  shortTextAnswerSchema,
  longTextAnswerSchema,
  emailAnswerSchema,
  phoneAnswerSchema,
  locationAnswerSchema,
  multipleChoiceAnswerSchema,
  dropdownAnswerSchema,
  dateAnswerSchema,
]);

export type ExchangeContactFormAnswerDto = z.infer<
  typeof exchangeContactFormAnswerSchema
>;

export const submitCustomFormExchangeContactSchema = z
  .object({
    // The version the visitor's browser last saw — used only to detect a
    // race against a concurrent edit (ExchangeContactFormSubmissionService
    // always re-resolves the card's actual current version server-side and
    // never trusts this value as authoritative).
    formVersionId: z.uuid(),
    answers: z.array(exchangeContactFormAnswerSchema),
    // Attribution carried over from the landing URL's `?src=&sref=` params so
    // the resulting EXCHANGE_CONTACT event can be traced to its source (e.g. a
    // virtual background). Not persisted on the Lead itself.
    trafficSource: z.string().optional(),
    trafficSourceRefId: z.uuid().optional(),
  })
  .strict();

export type SubmitCustomFormExchangeContactDto = z.infer<
  typeof submitCustomFormExchangeContactSchema
>;
