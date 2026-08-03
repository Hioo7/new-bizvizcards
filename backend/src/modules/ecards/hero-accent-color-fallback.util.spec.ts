import { resolveEffectiveAccentColors } from './hero-accent-color-fallback.util';
import type { EffectiveEcardPolicy } from '../plans/services/plan-policy-resolver.service';

function makePolicy(overrides: {
  accentColorCustomizationAvailable?: boolean;
  accentColorPresets?: EffectiveEcardPolicy['accentColorPresets'];
}): EffectiveEcardPolicy {
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
    },
    accentColorCustomizationAvailable:
      overrides.accentColorCustomizationAvailable ?? false,
    accentColorPresets: overrides.accentColorPresets ?? [],
  };
}

describe('resolveEffectiveAccentColors', () => {
  it('leaves both colors null untouched regardless of policy', () => {
    const card = {
      hero: { primaryAccentColor: null, secondaryAccentColor: null },
    };

    const result = resolveEffectiveAccentColors(card, makePolicy({}));

    expect(result).toBe(card);
  });

  it('leaves a stored pair in place when it matches an available preset', () => {
    const card = {
      hero: { primaryAccentColor: '#111111', secondaryAccentColor: '#222222' },
    };

    const result = resolveEffectiveAccentColors(
      card,
      makePolicy({
        accentColorPresets: [
          {
            themeAffinity: 'DARK',
            primaryColor: '#111111',
            secondaryColor: '#222222',
          },
        ],
      }),
    );

    expect(result).toBe(card);
  });

  it('leaves a stored pair in place when full custom access is granted', () => {
    const card = {
      hero: { primaryAccentColor: '#111111', secondaryAccentColor: '#222222' },
    };

    const result = resolveEffectiveAccentColors(
      card,
      makePolicy({ accentColorCustomizationAvailable: true }),
    );

    expect(result).toBe(card);
  });

  it('falls back to null/null when the pair matches no preset and custom access is no longer granted', () => {
    const card = {
      hero: { primaryAccentColor: '#111111', secondaryAccentColor: '#222222' },
    };

    const result = resolveEffectiveAccentColors(card, makePolicy({}));

    expect(result.hero.primaryAccentColor).toBeNull();
    expect(result.hero.secondaryAccentColor).toBeNull();
    expect(result).not.toBe(card);
  });

  it('preserves the rest of the card and hero fields when falling back', () => {
    const card = {
      customerId: 'customer-1',
      hero: {
        primaryAccentColor: '#111111',
        secondaryAccentColor: '#222222',
        name: 'Jane',
      },
    };

    const result = resolveEffectiveAccentColors(card, makePolicy({}));

    expect(result.customerId).toBe('customer-1');
    expect(result.hero.name).toBe('Jane');
  });
});
