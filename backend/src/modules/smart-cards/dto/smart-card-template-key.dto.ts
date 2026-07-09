import { z } from 'zod';
import { SmartCardTemplateKey } from '../../../generated/prisma/client';

export const smartCardTemplateKeyParamSchema = z.enum(SmartCardTemplateKey);
export type SmartCardTemplateKeyParam = z.infer<
  typeof smartCardTemplateKeyParamSchema
>;
