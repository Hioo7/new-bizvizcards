import { z } from 'zod';
import { EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH } from '../exchange-contact-forms.constants';
import { exchangeContactFormFieldsSchema } from './exchange-contact-form-field.dto';

export const createExchangeContactFormSchema = z
  .object({
    customerId: z.uuid(),
    name: z.string().trim().min(1).max(EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH),
    fields: exchangeContactFormFieldsSchema,
  })
  .strict();

export type CreateExchangeContactFormDto = z.infer<
  typeof createExchangeContactFormSchema
>;
