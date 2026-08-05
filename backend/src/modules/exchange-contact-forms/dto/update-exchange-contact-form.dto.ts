import { z } from 'zod';
import { EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH } from '../exchange-contact-forms.constants';
import { exchangeContactFormFieldsSchema } from './exchange-contact-form-field.dto';

// Full-replace: `fields` always represents the complete desired field list,
// mirroring EcardsService.update()'s full-replace convention for nested
// collections — the service decides whether this mutates the current
// version in place or forks a new one (see
// ExchangeContactFormsService.replaceCurrentVersionFields).
export const updateExchangeContactFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH)
      .optional(),
    fields: exchangeContactFormFieldsSchema,
  })
  .strict();

export type UpdateExchangeContactFormDto = z.infer<
  typeof updateExchangeContactFormSchema
>;
