import { SmartCardTemplateKey } from '../../../generated/prisma/client';
import type { PublicSmartCard } from '../services/smart-cards.service';
import {
  OG_PREVIEW_FALLBACK_TITLE,
  ogPreviewFallbackDescription,
} from '../smart-card-og-preview.constants';
import { ogPreviewFieldsRegistry } from './og-preview-registry';

function makeCard(profile: PublicSmartCard['profile']): PublicSmartCard {
  return {
    id: 'card-id',
    endpoint: 'test-endpoint',
    customerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile,
    contact: null,
    socialMedia: null,
    founder: null,
    services: [],
    testimonials: [],
    galleries: [],
    templateKey: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
  };
}

describe('ogPreviewFieldsRegistry', () => {
  it('has an extractor for every SmartCardTemplateKey', () => {
    for (const key of Object.values(SmartCardTemplateKey)) {
      expect(typeof ogPreviewFieldsRegistry[key]).toBe('function');
    }
  });

  describe('extractor (interior design templates)', () => {
    it('reads companyName, tagline, and logoUrl when present', () => {
      const card = makeCard({
        companyName: 'Acme Co',
        tagline: 'We build things',
        subTagline: null,
        aboutText: null,
        logoMediaId: 'media-id',
        logoUrl: '/media/bucket/logo.png',
      });

      const fields = ogPreviewFieldsRegistry[card.templateKey](card);

      expect(fields).toEqual({
        title: 'Acme Co',
        description: 'We build things',
        imageUrl: '/media/bucket/logo.png',
      });
    });

    it('falls back to subTagline when tagline is missing', () => {
      const card = makeCard({
        companyName: 'Acme Co',
        tagline: null,
        subTagline: 'Sub tagline text',
        aboutText: null,
        logoMediaId: null,
        logoUrl: null,
      });

      const fields = ogPreviewFieldsRegistry[card.templateKey](card);

      expect(fields.description).toBe('Sub tagline text');
    });

    it('falls back to a generic title when companyName is missing', () => {
      const card = makeCard({
        companyName: null,
        tagline: null,
        subTagline: null,
        aboutText: null,
        logoMediaId: null,
        logoUrl: null,
      });

      const fields = ogPreviewFieldsRegistry[card.templateKey](card);

      expect(fields.title).toBe(OG_PREVIEW_FALLBACK_TITLE);
      expect(fields.description).toBe(
        ogPreviewFallbackDescription(OG_PREVIEW_FALLBACK_TITLE),
      );
    });

    it('returns a null imageUrl when there is no logo (fallback applied by the service, not here)', () => {
      const card = makeCard({
        companyName: 'Acme Co',
        tagline: 'Tagline',
        subTagline: null,
        aboutText: null,
        logoMediaId: null,
        logoUrl: null,
      });

      const fields = ogPreviewFieldsRegistry[card.templateKey](card);

      expect(fields.imageUrl).toBeNull();
    });

    it('handles a null profile block gracefully', () => {
      const card = makeCard(null);

      const fields = ogPreviewFieldsRegistry[card.templateKey](card);

      expect(fields.title).toBe(OG_PREVIEW_FALLBACK_TITLE);
      expect(fields.imageUrl).toBeNull();
    });
  });
});
