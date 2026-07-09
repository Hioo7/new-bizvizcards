import { z } from 'zod';
import {
  SMART_CARD_TEXT_MEDIUM_MAX_LENGTH,
  SMART_CARD_TEXT_SHORT_MAX_LENGTH,
} from '../smart-cards.constants';

export const smartCardContactSchema = z
  .object({
    contactNumber: z
      .string()
      .trim()
      .max(SMART_CARD_TEXT_SHORT_MAX_LENGTH)
      .optional(),
    email: z.email().optional(),
    address: z
      .string()
      .trim()
      .max(SMART_CARD_TEXT_MEDIUM_MAX_LENGTH)
      .optional(),
  })
  .strict()
  .optional();

export type SmartCardContactDto = z.infer<typeof smartCardContactSchema>;
