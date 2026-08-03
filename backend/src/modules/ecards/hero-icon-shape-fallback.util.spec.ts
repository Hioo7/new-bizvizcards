import { resolveEffectiveIconShape } from './hero-icon-shape-fallback.util';
import { ECardIconShape } from '../../generated/prisma/client';
import type { EffectiveEcardPolicy } from '../plans/services/plan-policy-resolver.service';

function makePolicy(
  iconShapes: Partial<Record<ECardIconShape, boolean>>,
): EffectiveEcardPolicy {
  return {
    isAvailable: true,
    maxEcards: 10,
    exchangeContactAccess: true,
    components: {} as EffectiveEcardPolicy['components'],
    galleryLimits: {
      maxGalleries: 1,
      maxImagesPerGallery: 1,
      maxGallerySizeBytes: 1,
    },
    videoGalleryLimits: {
      maxVideoGalleries: 1,
      maxVideosPerGallery: 1,
    },
    heroLayouts: {
      DEFAULT: true,
      BANNER: false,
      BANNER_PROFILE: false,
      ORG_BADGE: false,
    },
    themes: { DEFAULT_DARK: true, LIGHT: false, NAVY_TEAL: false },
    iconShapes: {
      CIRCLE: true,
      SQUIRCLE: false,
      ROUNDED_SQUARE: false,
      TEARDROP: false,
      ...iconShapes,
    },
    accentColorCustomizationAvailable: false,
    accentColorPresets: [],
  };
}

describe('resolveEffectiveIconShape', () => {
  it('leaves CIRCLE untouched regardless of policy', () => {
    const card = { hero: { iconShape: ECardIconShape.CIRCLE } };

    const result = resolveEffectiveIconShape(card, makePolicy({}));

    expect(result).toBe(card);
  });

  it('leaves a gated icon shape in place when the plan allows it', () => {
    const card = { hero: { iconShape: ECardIconShape.TEARDROP } };

    const result = resolveEffectiveIconShape(
      card,
      makePolicy({ TEARDROP: true }),
    );

    expect(result).toBe(card);
  });

  it('falls back to CIRCLE when the plan no longer allows the stored icon shape', () => {
    const card = { hero: { iconShape: ECardIconShape.SQUIRCLE } };

    const result = resolveEffectiveIconShape(
      card,
      makePolicy({ SQUIRCLE: false }),
    );

    expect(result.hero.iconShape).toBe(ECardIconShape.CIRCLE);
    expect(result).not.toBe(card);
  });

  it('preserves the rest of the card and hero fields when falling back', () => {
    const card = {
      customerId: 'customer-1',
      hero: { iconShape: ECardIconShape.SQUIRCLE, name: 'Jane' },
    };

    const result = resolveEffectiveIconShape(
      card,
      makePolicy({ SQUIRCLE: false }),
    );

    expect(result.customerId).toBe('customer-1');
    expect(result.hero.name).toBe('Jane');
  });
});
