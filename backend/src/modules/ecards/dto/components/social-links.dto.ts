import { z } from 'zod';

const urlField = z.url().max(2048).optional();

export const ecardSocialLinksComponentSchema = z
  .object({
    type: z.literal('SOCIAL_LINKS'),
    whatsapp: urlField,
    website: urlField,
    instagram: urlField,
    facebook: urlField,
    twitter: urlField,
    linkedIn: urlField,
  })
  .strict();

export type EcardSocialLinksComponentDto = z.infer<
  typeof ecardSocialLinksComponentSchema
>;
