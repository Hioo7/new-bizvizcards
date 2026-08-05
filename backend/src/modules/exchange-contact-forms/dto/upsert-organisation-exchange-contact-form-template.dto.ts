import { z } from 'zod';
import { EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH } from '../exchange-contact-forms.constants';
import { exchangeContactFormFieldsSchema } from './exchange-contact-form-field.dto';

// The organisation's exchange-contact-form template is a singleton per org
// (unique on ExchangeContactForm.organisationId) — every save re-states the
// full desired shape (name + fields), same full-replace convention as
// updateExchangeContactFormSchema. The service creates it on the first call
// and thereafter runs it through the same mutate-in-place-or-fork versioning
// as a customer's own form.
export const upsertOrganisationExchangeContactFormTemplateSchema = z
  .object({
    name: z.string().trim().min(1).max(EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH),
    fields: exchangeContactFormFieldsSchema,
  })
  .strict();

export type UpsertOrganisationExchangeContactFormTemplateDto = z.infer<
  typeof upsertOrganisationExchangeContactFormTemplateSchema
>;
