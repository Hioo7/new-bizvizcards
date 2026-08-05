import { z } from 'zod';
import { EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH } from '../exchange-contact-forms.constants';
import { exchangeContactFormFieldsSchema } from './exchange-contact-form-field.dto';

// Same shape as createExchangeContactFormSchema minus `customerId` — the
// customer-facing controller supplies that itself from the authenticated
// session, never trusting a client-provided customerId.
export const createMyExchangeContactFormSchema = z
  .object({
    name: z.string().trim().min(1).max(EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH),
    fields: exchangeContactFormFieldsSchema,
  })
  .strict();

export type CreateMyExchangeContactFormDto = z.infer<
  typeof createMyExchangeContactFormSchema
>;
