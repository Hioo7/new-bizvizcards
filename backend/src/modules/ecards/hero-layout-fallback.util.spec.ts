import { resolveEffectiveHeroLayout } from './hero-layout-fallback.util';
import { ECardHeroLayout } from '../../generated/prisma/client';
import type { EffectiveEcardPolicy } from '../plans/services/plan-policy-resolver.service';

function makePolicy(
  heroLayouts: Partial<Record<ECardHeroLayout, boolean>>,
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
    heroLayouts: {
      DEFAULT: true,
      BANNER: false,
      BANNER_PROFILE: false,
      ORG_BADGE: false,
      ...heroLayouts,
    },
  };
}

describe('resolveEffectiveHeroLayout', () => {
  it('leaves DEFAULT untouched regardless of policy', () => {
    const card = {
      organisationId: null,
      hero: { layout: ECardHeroLayout.DEFAULT },
    };

    const result = resolveEffectiveHeroLayout(card, makePolicy({}));

    expect(result).toBe(card);
  });

  it('leaves a gated layout in place when the plan allows it', () => {
    const card = {
      organisationId: null,
      hero: { layout: ECardHeroLayout.BANNER },
    };

    const result = resolveEffectiveHeroLayout(
      card,
      makePolicy({ BANNER: true }),
    );

    expect(result).toBe(card);
  });

  it('falls back to DEFAULT when the plan no longer allows the stored layout', () => {
    const card = {
      organisationId: null,
      hero: { layout: ECardHeroLayout.BANNER },
    };

    const result = resolveEffectiveHeroLayout(
      card,
      makePolicy({ BANNER: false }),
    );

    expect(result.hero.layout).toBe(ECardHeroLayout.DEFAULT);
    expect(result).not.toBe(card);
  });

  it('falls back to DEFAULT for ORG_BADGE when the card has no organisation', () => {
    const card = {
      organisationId: null,
      hero: { layout: ECardHeroLayout.ORG_BADGE },
    };

    const result = resolveEffectiveHeroLayout(
      card,
      makePolicy({ ORG_BADGE: true }),
    );

    expect(result.hero.layout).toBe(ECardHeroLayout.DEFAULT);
  });

  it('keeps ORG_BADGE when the plan allows it and an organisation is linked', () => {
    const card = {
      organisationId: 'org-1',
      hero: { layout: ECardHeroLayout.ORG_BADGE },
    };

    const result = resolveEffectiveHeroLayout(
      card,
      makePolicy({ ORG_BADGE: true }),
    );

    expect(result).toBe(card);
  });

  it('preserves the rest of the card and hero fields when falling back', () => {
    const card = {
      organisationId: 'org-1',
      customerId: 'customer-1',
      hero: { layout: ECardHeroLayout.BANNER, name: 'Jane' },
    };

    const result = resolveEffectiveHeroLayout(
      card,
      makePolicy({ BANNER: false }),
    );

    expect(result.customerId).toBe('customer-1');
    expect(result.hero.name).toBe('Jane');
  });
});
