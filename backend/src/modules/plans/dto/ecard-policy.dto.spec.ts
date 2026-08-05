import { ECardComponentType } from '../../../generated/prisma/client';
import {
  ECARD_GATED_HERO_LAYOUTS,
  ECARD_GATED_ICON_SHAPES,
  ECARD_GATED_THEMES,
} from '../../ecards/ecards.constants';
import { ecardPolicySchema } from './ecard-policy.dto';

function validEcardPolicy(overrides: Record<string, unknown> = {}) {
  return {
    isAvailable: true,
    maxEcards: 3,
    exchangeContactAccess: true,
    isCustomFormAvailable: false,
    maxCustomForms: 0,
    accentColorCustomizationAvailable: false,
    componentAvailabilities: Object.values(ECardComponentType).map((type) => ({
      type,
      isAvailable: true,
      ...(type === 'GALLERY' && {
        galleryLimits: {
          maxGalleries: 1,
          maxImagesPerGallery: 5,
          maxGallerySizeBytes: 5 * 1024 * 1024,
        },
      }),
      ...(type === 'VIDEO_GALLERY' && {
        videoGalleryLimits: { maxVideoGalleries: 1, maxVideosPerGallery: 5 },
      }),
    })),
    heroLayoutAvailabilities: ECARD_GATED_HERO_LAYOUTS.map((layout) => ({
      layout,
      isAvailable: false,
    })),
    themeAvailabilities: ECARD_GATED_THEMES.map((theme) => ({
      theme,
      isAvailable: false,
    })),
    iconShapeAvailabilities: ECARD_GATED_ICON_SHAPES.map((iconShape) => ({
      iconShape,
      isAvailable: false,
    })),
    accentColorPresets: [],
    ...overrides,
  };
}

describe('ecardPolicySchema — custom-form/exchange-contact dependency', () => {
  it('accepts exchangeContactAccess: true with isCustomFormAvailable: true', () => {
    const result = ecardPolicySchema.safeParse(
      validEcardPolicy({
        exchangeContactAccess: true,
        isCustomFormAvailable: true,
      }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts exchangeContactAccess: false with isCustomFormAvailable: false', () => {
    const result = ecardPolicySchema.safeParse(
      validEcardPolicy({
        exchangeContactAccess: false,
        isCustomFormAvailable: false,
      }),
    );
    expect(result.success).toBe(true);
  });

  it('accepts exchangeContactAccess: true with isCustomFormAvailable: false', () => {
    const result = ecardPolicySchema.safeParse(
      validEcardPolicy({
        exchangeContactAccess: true,
        isCustomFormAvailable: false,
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects isCustomFormAvailable: true when exchangeContactAccess is false', () => {
    const result = ecardPolicySchema.safeParse(
      validEcardPolicy({
        exchangeContactAccess: false,
        isCustomFormAvailable: true,
      }),
    );
    expect(result.success).toBe(false);
  });
});
