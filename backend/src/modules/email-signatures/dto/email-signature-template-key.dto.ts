import { z } from 'zod';
import { EmailSignatureTemplateKey } from '../../../generated/prisma/client';

export const emailSignatureTemplateKeySchema = z.enum(
  EmailSignatureTemplateKey,
);
export type EmailSignatureTemplateKeyDto = z.infer<
  typeof emailSignatureTemplateKeySchema
>;
