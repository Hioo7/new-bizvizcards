import { z } from 'zod';
import { ProductMediaPurpose } from '../../../generated/prisma/client';

// Multipart form fields arrive as strings, so sortOrder is coerced —
// this DTO validates the "purpose"/"sortOrder" form fields alongside the
// separately-handled uploaded file.
export const addProductMediaSchema = z
  .object({
    purpose: z.enum(ProductMediaPurpose),
    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .strict();

export type AddProductMediaDto = z.infer<typeof addProductMediaSchema>;
