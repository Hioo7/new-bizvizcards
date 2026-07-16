import { z } from 'zod';
import { ECardComponentType } from '../../../generated/prisma/client';

const galleryComponentLimitsSchema = z
  .object({
    maxGalleries: z.number().int().min(0),
    maxImagesPerGallery: z.number().int().min(0),
    maxGallerySizeBytes: z.number().int().min(0),
  })
  .strict();

const ecardComponentAvailabilitySchema = z
  .object({
    type: z.enum(ECardComponentType),
    isAvailable: z.boolean(),
    // Required iff type === 'GALLERY' — enforced by the refine below since
    // Prisma/Zod can't express a conditional field keyed off a sibling enum.
    galleryLimits: galleryComponentLimitsSchema.optional(),
  })
  .strict()
  .refine(
    (value) => value.type !== 'GALLERY' || value.galleryLimits !== undefined,
    {
      message: 'galleryLimits is required for the GALLERY component',
      path: ['galleryLimits'],
    },
  )
  .refine(
    (value) => value.type === 'GALLERY' || value.galleryLimits === undefined,
    {
      message: 'galleryLimits may only be set for the GALLERY component',
      path: ['galleryLimits'],
    },
  );

export const ecardPolicySchema = z
  .object({
    isAvailable: z.boolean(),
    maxEcards: z.number().int().min(0),
    exchangeContactAccess: z.boolean(),
    componentAvailabilities: z.array(ecardComponentAvailabilitySchema),
  })
  .strict()
  .refine(
    (value) => {
      const types = value.componentAvailabilities.map((c) => c.type);
      const uniqueTypes = new Set(types);
      const allTypes = Object.values(ECardComponentType);
      return (
        uniqueTypes.size === types.length &&
        allTypes.every((type) => uniqueTypes.has(type))
      );
    },
    {
      message:
        'componentAvailabilities must include exactly one entry for every e-card component type',
      path: ['componentAvailabilities'],
    },
  );

export type EcardPolicyDto = z.infer<typeof ecardPolicySchema>;
