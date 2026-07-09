import { z } from 'zod';
import { SMART_CARD_TEXT_MEDIUM_MAX_LENGTH } from '../smart-cards.constants';

const socialLink = z
  .string()
  .trim()
  .max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH)
  .optional();

export const smartCardSocialMediaSchema = z
  .object({
    whatsapp: socialLink,
    instagram: socialLink,
    facebook: socialLink,
    linkedIn: socialLink,
    twitter: socialLink,
    youtube: socialLink,
    googleMap: socialLink,
    website: socialLink,
    other: socialLink,
  })
  .strict()
  .optional();

export type SmartCardSocialMediaDto = z.infer<
  typeof smartCardSocialMediaSchema
>;
