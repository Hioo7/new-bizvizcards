import { z } from 'zod';
import { ECardComponentType } from '../../../generated/prisma/client';
import { ECARD_GATED_HERO_LAYOUTS } from '../../ecards/ecards.constants';

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

// Only the plan-restrictable layouts — DEFAULT is never included here, it's
// hard-coded as always-available in PlanPolicyResolverService.
const ecardHeroLayoutAvailabilitySchema = z
  .object({
    layout: z.enum(ECARD_GATED_HERO_LAYOUTS),
    isAvailable: z.boolean(),
  })
  .strict();

export const ecardPolicySchema = z
  .object({
    isAvailable: z.boolean(),
    maxEcards: z.number().int().min(0),
    exchangeContactAccess: z.boolean(),
    componentAvailabilities: z.array(ecardComponentAvailabilitySchema),
    heroLayoutAvailabilities: z.array(ecardHeroLayoutAvailabilitySchema),
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
  )
  .refine(
    (value) => {
      const layouts = value.heroLayoutAvailabilities.map((h) => h.layout);
      const uniqueLayouts = new Set(layouts);
      return (
        uniqueLayouts.size === layouts.length &&
        ECARD_GATED_HERO_LAYOUTS.every((layout) => uniqueLayouts.has(layout))
      );
    },
    {
      message:
        'heroLayoutAvailabilities must include exactly one entry for every gated Hero layout',
      path: ['heroLayoutAvailabilities'],
    },
  );

export type EcardPolicyDto = z.infer<typeof ecardPolicySchema>;
