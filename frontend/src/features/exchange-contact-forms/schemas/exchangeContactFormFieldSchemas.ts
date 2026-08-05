import { z } from "zod";
import {
  EXCHANGE_CONTACT_FIELD_HELP_TEXT_MAX_LENGTH,
  EXCHANGE_CONTACT_FIELD_LABEL_MAX_LENGTH,
  EXCHANGE_CONTACT_FIELD_MAX_OPTIONS,
  EXCHANGE_CONTACT_FIELD_MIN_OPTIONS,
  EXCHANGE_CONTACT_FIELD_OPTION_LABEL_MAX_LENGTH,
} from "@features/exchange-contact-forms/config/exchangeContactFormBuilder.config";

// Shared by every "core" field type (SHORT_TEXT/LONG_TEXT/PHONE/EMAIL/
// LOCATION/DATE) and the untagged "Short answer" custom question — all of
// them only ever expose label/helpText/isRequired as editable form fields.
export const simpleFieldSheetSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Required")
    .max(EXCHANGE_CONTACT_FIELD_LABEL_MAX_LENGTH),
  helpText: z.string().trim().max(EXCHANGE_CONTACT_FIELD_HELP_TEXT_MAX_LENGTH),
  isRequired: z.boolean(),
});

export type SimpleFieldSheetValues = z.infer<typeof simpleFieldSheetSchema>;

const choiceOptionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Required")
    .max(EXCHANGE_CONTACT_FIELD_OPTION_LABEL_MAX_LENGTH),
});

export const choiceFieldSheetSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Required")
    .max(EXCHANGE_CONTACT_FIELD_LABEL_MAX_LENGTH),
  helpText: z.string().trim().max(EXCHANGE_CONTACT_FIELD_HELP_TEXT_MAX_LENGTH),
  isRequired: z.boolean(),
  options: z
    .array(choiceOptionSchema)
    .min(
      EXCHANGE_CONTACT_FIELD_MIN_OPTIONS,
      `Add at least ${EXCHANGE_CONTACT_FIELD_MIN_OPTIONS} options`,
    )
    .max(EXCHANGE_CONTACT_FIELD_MAX_OPTIONS),
});

export type ChoiceFieldSheetValues = z.infer<typeof choiceFieldSheetSchema>;
