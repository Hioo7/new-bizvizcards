import { z } from 'zod';
import { HEX_COLOR_REGEX } from '../../../common/constants/color.constants';
import {
  ECardAccentColorPresetThemeAffinity,
  ECardComponentType,
} from '../../../generated/prisma/client';
import {
  ECARD_GATED_HERO_LAYOUTS,
  ECARD_GATED_ICON_SHAPES,
  ECARD_GATED_THEMES,
  ECARD_MAX_ACCENT_COLOR_PRESETS,
} from '../../ecards/ecards.constants';

const galleryComponentLimitsSchema = z
  .object({
    maxGalleries: z.number().int().min(0),
    maxImagesPerGallery: z.number().int().min(0),
    maxGallerySizeBytes: z.number().int().min(0),
  })
  .strict();

// Same shape as galleryComponentLimitsSchema, minus a file-size dimension —
// video gallery entries are URLs, not uploads.
const videoGalleryComponentLimitsSchema = z
  .object({
    maxVideoGalleries: z.number().int().min(0),
    maxVideosPerGallery: z.number().int().min(0),
  })
  .strict();

const ecardComponentAvailabilitySchema = z
  .object({
    type: z.enum(ECardComponentType),
    isAvailable: z.boolean(),
    // Required iff type === 'GALLERY' — enforced by the refine below since
    // Prisma/Zod can't express a conditional field keyed off a sibling enum.
    galleryLimits: galleryComponentLimitsSchema.optional(),
    // Same pattern as galleryLimits above, required iff type === 'VIDEO_GALLERY'.
    videoGalleryLimits: videoGalleryComponentLimitsSchema.optional(),
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
  )
  .refine(
    (value) =>
      value.type !== 'VIDEO_GALLERY' || value.videoGalleryLimits !== undefined,
    {
      message: 'videoGalleryLimits is required for the VIDEO_GALLERY component',
      path: ['videoGalleryLimits'],
    },
  )
  .refine(
    (value) =>
      value.type === 'VIDEO_GALLERY' || value.videoGalleryLimits === undefined,
    {
      message:
        'videoGalleryLimits may only be set for the VIDEO_GALLERY component',
      path: ['videoGalleryLimits'],
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

// Only the plan-restrictable themes — DEFAULT_DARK is never included here,
// it's hard-coded as always-available in PlanPolicyResolverService.
const ecardThemeAvailabilitySchema = z
  .object({
    theme: z.enum(ECARD_GATED_THEMES),
    isAvailable: z.boolean(),
  })
  .strict();

// Only the plan-restrictable icon shapes — CIRCLE is never included here,
// same convention as ecardThemeAvailabilitySchema above.
const ecardIconShapeAvailabilitySchema = z
  .object({
    iconShape: z.enum(ECARD_GATED_ICON_SHAPES),
    isAvailable: z.boolean(),
  })
  .strict();

// Free-form admin-authored content, not a fixed-enum whitelist — no
// completeness refine needed the way the availability lists above have one.
const ecardAccentColorPresetSchema = z
  .object({
    themeAffinity: z.enum(ECardAccentColorPresetThemeAffinity),
    primaryColor: z.string().trim().regex(HEX_COLOR_REGEX),
    secondaryColor: z.string().trim().regex(HEX_COLOR_REGEX),
  })
  .strict();

export const ecardPolicySchema = z
  .object({
    isAvailable: z.boolean(),
    maxEcards: z.number().int().min(0),
    exchangeContactAccess: z.boolean(),
    // Full free-hex custom accent-color entry — independent of
    // accentColorPresets below.
    accentColorCustomizationAvailable: z.boolean(),
    componentAvailabilities: z.array(ecardComponentAvailabilitySchema),
    heroLayoutAvailabilities: z.array(ecardHeroLayoutAvailabilitySchema),
    themeAvailabilities: z.array(ecardThemeAvailabilitySchema),
    iconShapeAvailabilities: z.array(ecardIconShapeAvailabilitySchema),
    accentColorPresets: z
      .array(ecardAccentColorPresetSchema)
      .max(ECARD_MAX_ACCENT_COLOR_PRESETS),
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
  )
  .refine(
    (value) => {
      const themes = value.themeAvailabilities.map((t) => t.theme);
      const uniqueThemes = new Set(themes);
      return (
        uniqueThemes.size === themes.length &&
        ECARD_GATED_THEMES.every((theme) => uniqueThemes.has(theme))
      );
    },
    {
      message:
        'themeAvailabilities must include exactly one entry for every gated theme',
      path: ['themeAvailabilities'],
    },
  )
  .refine(
    (value) => {
      const shapes = value.iconShapeAvailabilities.map((s) => s.iconShape);
      const uniqueShapes = new Set(shapes);
      return (
        uniqueShapes.size === shapes.length &&
        ECARD_GATED_ICON_SHAPES.every((shape) => uniqueShapes.has(shape))
      );
    },
    {
      message:
        'iconShapeAvailabilities must include exactly one entry for every gated icon shape',
      path: ['iconShapeAvailabilities'],
    },
  );

export type EcardPolicyDto = z.infer<typeof ecardPolicySchema>;
