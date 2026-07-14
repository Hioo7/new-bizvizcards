import { z } from 'zod';

export const ecardAnalyticsQuerySchema = z
  .object({
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  })
  .strict()
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: 'from must be before or equal to to',
    path: ['from'],
  });

export type EcardAnalyticsQueryDto = z.infer<typeof ecardAnalyticsQuerySchema>;
