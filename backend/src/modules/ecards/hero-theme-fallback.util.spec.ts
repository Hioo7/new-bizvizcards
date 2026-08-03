import { resolveEffectiveTheme } from './hero-theme-fallback.util';
import { ECardTheme } from '../../generated/prisma/client';
import type { EffectiveEcardPolicy } from '../plans/services/plan-policy-resolver.service';

function makePolicy(
  themes: Partial<Record<ECardTheme, boolean>>,
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
    themes: {
      DEFAULT_DARK: true,
      LIGHT: false,
      NAVY_TEAL: false,
      ...themes,
    },
    iconShapes: {
      CIRCLE: true,
      SQUIRCLE: false,
      ROUNDED_SQUARE: false,
      TEARDROP: false,
    },
    accentColorCustomizationAvailable: false,
    accentColorPresets: [],
  };
}

describe('resolveEffectiveTheme', () => {
  it('leaves DEFAULT_DARK untouched regardless of policy', () => {
    const card = { hero: { theme: ECardTheme.DEFAULT_DARK } };

    const result = resolveEffectiveTheme(card, makePolicy({}));

    expect(result).toBe(card);
  });

  it('leaves a gated theme in place when the plan allows it', () => {
    const card = { hero: { theme: ECardTheme.NAVY_TEAL } };

    const result = resolveEffectiveTheme(card, makePolicy({ NAVY_TEAL: true }));

    expect(result).toBe(card);
  });

  it('falls back to DEFAULT_DARK when the plan no longer allows the stored theme', () => {
    const card = { hero: { theme: ECardTheme.LIGHT } };

    const result = resolveEffectiveTheme(card, makePolicy({ LIGHT: false }));

    expect(result.hero.theme).toBe(ECardTheme.DEFAULT_DARK);
    expect(result).not.toBe(card);
  });

  it('preserves the rest of the card and hero fields when falling back', () => {
    const card = {
      customerId: 'customer-1',
      hero: { theme: ECardTheme.LIGHT, name: 'Jane' },
    };

    const result = resolveEffectiveTheme(card, makePolicy({ LIGHT: false }));

    expect(result.customerId).toBe('customer-1');
    expect(result.hero.name).toBe('Jane');
  });
});
