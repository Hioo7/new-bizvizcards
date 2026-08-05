import { mergeOrganisationEcardTemplateOntoCard } from './organisation-ecard-template-merge.util';
import type {
  EcardComponentResponse,
  PublicEcard,
} from './services/ecards.service';
import type {
  OrganisationEcardTemplateComponentResponse,
  OrganisationEcardTemplateResponse,
} from '../organisations/services/organisation-ecard-template.service';

function makeCard(overrides?: {
  hero?: Partial<PublicEcard['hero']>;
  components?: EcardComponentResponse[];
}): PublicEcard {
  return {
    id: 'card-1',
    endpoint: 'jane-doe',
    customerId: 'customer-1',
    organisationId: 'org-1',
    customFormId: null,
    createdByEmployeeId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    hero: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      companyName: null,
      profilePhotoMediaId: null,
      profilePhotoUrl: null,
      phoneCountryDialCode: null,
      phoneNumber: null,
      isExchangeContactEnabled: true,
      autoDownloadContact: false,
      layout: 'DEFAULT',
      bannerMediaId: null,
      bannerUrl: null,
      bannerFallbackColor: null,
      badgeFallbackColor: null,
      theme: 'DEFAULT_DARK',
      primaryAccentColor: null,
      secondaryAccentColor: null,
      iconShape: 'CIRCLE',
      organisationLogoUrl: null,
      ...overrides?.hero,
    },
    components: overrides?.components ?? [],
  };
}

function makeTemplate(overrides?: {
  hero?: Partial<OrganisationEcardTemplateResponse['hero']>;
  components?: OrganisationEcardTemplateComponentResponse[];
}): OrganisationEcardTemplateResponse {
  return {
    id: 'template-1',
    organisationId: 'org-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    hero: {
      name: null,
      email: null,
      companyName: null,
      profilePhotoMediaId: null,
      profilePhotoUrl: null,
      phoneCountryDialCode: null,
      phoneNumber: null,
      layout: null,
      bannerMediaId: null,
      bannerUrl: null,
      bannerFallbackColor: null,
      badgeFallbackColor: null,
      theme: null,
      primaryAccentColor: null,
      secondaryAccentColor: null,
      iconShape: null,
      ...overrides?.hero,
    },
    components: overrides?.components ?? [],
  };
}

describe('mergeOrganisationEcardTemplateOntoCard', () => {
  it('returns the card unchanged when there is no template', () => {
    const card = makeCard();

    expect(mergeOrganisationEcardTemplateOntoCard(card, null)).toBe(card);
  });

  describe('hero merge', () => {
    it('uses the template value when set, falling back to the card for everything else', () => {
      const card = makeCard({
        hero: { name: 'Jane Doe', companyName: null, phoneNumber: '5551234' },
      });
      const template = makeTemplate({
        hero: { companyName: 'Acme Corp' },
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      expect(merged.hero.name).toBe('Jane Doe'); // template left it unset
      expect(merged.hero.companyName).toBe('Acme Corp'); // template overrides
      expect(merged.hero.phoneNumber).toBe('5551234'); // template left it unset
    });

    it('leaves settings booleans (never override-capable) exactly as the card had them', () => {
      const card = makeCard({
        hero: { isExchangeContactEnabled: false, autoDownloadContact: true },
      });
      const template = makeTemplate();

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      expect(merged.hero.isExchangeContactEnabled).toBe(false);
      expect(merged.hero.autoDownloadContact).toBe(true);
    });

    it("overrides the card's layout and banner fields when the template sets them", () => {
      const card = makeCard({
        hero: { layout: 'DEFAULT', bannerUrl: null, bannerFallbackColor: null },
      });
      const template = makeTemplate({
        hero: {
          layout: 'BANNER',
          bannerMediaId: 'org-banner-media',
          bannerUrl: '/org-banner.png',
          bannerFallbackColor: '#112233',
        },
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      expect(merged.hero.layout).toBe('BANNER');
      expect(merged.hero.bannerUrl).toBe('/org-banner.png');
      expect(merged.hero.bannerFallbackColor).toBe('#112233');
    });

    it("falls through to the card's own layout and banner fields when the template leaves them unset", () => {
      const card = makeCard({
        hero: {
          layout: 'BANNER_PROFILE',
          bannerUrl: '/card-banner.png',
          bannerFallbackColor: '#aabbcc',
          badgeFallbackColor: '#ffffff',
        },
      });
      const template = makeTemplate();

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      expect(merged.hero.layout).toBe('BANNER_PROFILE');
      expect(merged.hero.bannerUrl).toBe('/card-banner.png');
      expect(merged.hero.bannerFallbackColor).toBe('#aabbcc');
      expect(merged.hero.badgeFallbackColor).toBe('#ffffff');
    });

    it("overrides the card's theme, accent colors, and icon shape when the template locks them", () => {
      const card = makeCard({
        hero: {
          theme: 'DEFAULT_DARK',
          primaryAccentColor: null,
          secondaryAccentColor: null,
          iconShape: 'CIRCLE',
        },
      });
      const template = makeTemplate({
        hero: {
          theme: 'NAVY_TEAL',
          primaryAccentColor: '#112233',
          secondaryAccentColor: '#445566',
          iconShape: 'TEARDROP',
        },
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      expect(merged.hero.theme).toBe('NAVY_TEAL');
      expect(merged.hero.primaryAccentColor).toBe('#112233');
      expect(merged.hero.secondaryAccentColor).toBe('#445566');
      expect(merged.hero.iconShape).toBe('TEARDROP');
    });

    it("falls through to the card's own theme, accent colors, and icon shape when the template leaves them unset", () => {
      const card = makeCard({
        hero: {
          theme: 'LIGHT',
          primaryAccentColor: '#abcdef',
          secondaryAccentColor: '#fedcba',
          iconShape: 'SQUIRCLE',
        },
      });
      const template = makeTemplate();

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      expect(merged.hero.theme).toBe('LIGHT');
      expect(merged.hero.primaryAccentColor).toBe('#abcdef');
      expect(merged.hero.secondaryAccentColor).toBe('#fedcba');
      expect(merged.hero.iconShape).toBe('SQUIRCLE');
    });
  });

  describe('scalar component merge (ABOUT)', () => {
    it('merges field by field — template wins where set, card wins where the template left it blank', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'ABOUT',
            profession: 'Engineer',
            shortNote: 'Card note',
            description: null,
            aboutMe: 'Card bio',
          },
        ],
      });
      const template = makeTemplate({
        components: [
          {
            id: 't1',
            order: 0,
            type: 'ABOUT',
            profession: null,
            shortNote: 'Org note',
            description: 'Org description',
            aboutMe: null,
          },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);
      const about = merged.components[0];
      expect(about.type).toBe('ABOUT');
      if (about.type !== 'ABOUT') throw new Error('unreachable');
      expect(about.profession).toBe('Engineer'); // template unset -> card's
      expect(about.shortNote).toBe('Org note'); // template set -> template's
      expect(about.description).toBe('Org description'); // template set -> template's
      expect(about.aboutMe).toBe('Card bio'); // template unset -> card's
    });
  });

  describe('scalar component merge (SOCIAL_LINKS youtube)', () => {
    it('merges youtube field by field — template wins where set, card wins where the template left it blank', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'SOCIAL_LINKS',
            website: null,
            instagram: 'https://instagram.com/card-handle',
            facebook: null,
            twitter: null,
            linkedIn: null,
            youtube: 'https://www.youtube.com/@card-channel',
          },
        ],
      });
      const template = makeTemplate({
        components: [
          {
            id: 't1',
            order: 0,
            type: 'SOCIAL_LINKS',
            website: null,
            instagram: null,
            facebook: null,
            twitter: null,
            linkedIn: null,
            youtube: 'https://www.youtube.com/@org-channel',
          },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);
      const socialLinks = merged.components[0];
      if (socialLinks.type !== 'SOCIAL_LINKS') throw new Error('unreachable');
      expect(socialLinks.youtube).toBe('https://www.youtube.com/@org-channel'); // template set -> template's
      expect(socialLinks.instagram).toBe('https://instagram.com/card-handle'); // template unset -> card's
    });
  });

  describe('whole-value components (GALLERY / TEAM / BROCHURE)', () => {
    it('replaces the card gallery with the template gallery when the template has content', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'GALLERY',
            subGalleries: [{ id: 'sg1', title: 'Card gallery', images: [] }],
          },
        ],
      });
      const template = makeTemplate({
        components: [
          {
            id: 't1',
            order: 0,
            type: 'GALLERY',
            subGalleries: [
              {
                id: 'sg2',
                title: 'Org gallery',
                images: [
                  { imageMediaId: 'm1', imageUrl: '/m1.png', caption: null },
                ],
              },
            ],
          },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);
      const gallery = merged.components[0];
      if (gallery.type !== 'GALLERY') throw new Error('unreachable');
      expect(gallery.subGalleries[0].title).toBe('Org gallery');
    });

    it('falls through to the card gallery entirely when the template component is empty', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'GALLERY',
            subGalleries: [{ id: 'sg1', title: 'Card gallery', images: [] }],
          },
        ],
      });
      const template = makeTemplate({
        components: [{ id: 't1', order: 0, type: 'GALLERY', subGalleries: [] }],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);
      const gallery = merged.components[0];
      if (gallery.type !== 'GALLERY') throw new Error('unreachable');
      expect(gallery.subGalleries[0].title).toBe('Card gallery');
    });

    it('replaces the card video gallery with the template video gallery when the template has content', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'VIDEO_GALLERY',
            subGalleries: [
              { id: 'sg1', title: 'Card video gallery', videos: [] },
            ],
          },
        ],
      });
      const template = makeTemplate({
        components: [
          {
            id: 't1',
            order: 0,
            type: 'VIDEO_GALLERY',
            subGalleries: [
              {
                id: 'sg2',
                title: 'Org video gallery',
                videos: [
                  {
                    videoUrl: 'https://www.youtube.com/embed/abc123',
                    caption: null,
                  },
                ],
              },
            ],
          },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);
      const videoGallery = merged.components[0];
      if (videoGallery.type !== 'VIDEO_GALLERY') throw new Error('unreachable');
      expect(videoGallery.subGalleries[0].title).toBe('Org video gallery');
    });

    it('falls through to the card video gallery entirely when the template component is empty', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'VIDEO_GALLERY',
            subGalleries: [
              { id: 'sg1', title: 'Card video gallery', videos: [] },
            ],
          },
        ],
      });
      const template = makeTemplate({
        components: [
          { id: 't1', order: 0, type: 'VIDEO_GALLERY', subGalleries: [] },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);
      const videoGallery = merged.components[0];
      if (videoGallery.type !== 'VIDEO_GALLERY') throw new Error('unreachable');
      expect(videoGallery.subGalleries[0].title).toBe('Card video gallery');
    });

    it('falls through to the card brochure when the template brochure has no pdf set', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'BROCHURE',
            pdfMediaId: 'card-pdf',
            pdfUrl: '/card.pdf',
            fileName: 'card.pdf',
          },
        ],
      });
      const template = makeTemplate({
        components: [
          {
            id: 't1',
            order: 0,
            type: 'BROCHURE',
            pdfMediaId: null,
            pdfUrl: null,
            fileName: null,
          },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);
      const brochure = merged.components[0];
      if (brochure.type !== 'BROCHURE') throw new Error('unreachable');
      expect(brochure.pdfMediaId).toBe('card-pdf');
    });
  });

  describe('scalar component merge (LOCATION_TILE / REVIEW_LINK)', () => {
    it('merges LOCATION_TILE field by field — template wins where set, card wins where the template left it blank', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'LOCATION_TILE',
            label: 'Card Office',
            latitude: 12.34,
            longitude: 56.78,
          },
        ],
      });
      const template = makeTemplate({
        components: [
          {
            id: 't1',
            order: 0,
            type: 'LOCATION_TILE',
            label: 'Org HQ',
            latitude: null,
            longitude: null,
          },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);
      const locationTile = merged.components[0];
      if (locationTile.type !== 'LOCATION_TILE') throw new Error('unreachable');
      expect(locationTile.label).toBe('Org HQ'); // template set -> template's
      expect(locationTile.latitude).toBe(12.34); // template unset -> card's
      expect(locationTile.longitude).toBe(56.78); // template unset -> card's
    });

    it('merges REVIEW_LINK field by field — template wins where set, card wins where the template left it blank', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'REVIEW_LINK',
            url: 'https://card-review.example.com',
          },
        ],
      });
      const template = makeTemplate({
        components: [{ id: 't1', order: 0, type: 'REVIEW_LINK', url: null }],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);
      const reviewLink = merged.components[0];
      if (reviewLink.type !== 'REVIEW_LINK') throw new Error('unreachable');
      expect(reviewLink.url).toBe('https://card-review.example.com');
    });
  });

  describe('whole-value component (TESTIMONIALS)', () => {
    it('replaces the card testimonials with the template testimonials when the template has entries', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'TESTIMONIALS',
            entries: [
              { id: 'e1', name: 'Card Person', rating: 3, text: 'Card text' },
            ],
          },
        ],
      });
      const template = makeTemplate({
        components: [
          {
            id: 't1',
            order: 0,
            type: 'TESTIMONIALS',
            entries: [
              { id: 'e2', name: 'Org Person', rating: 5, text: 'Org text' },
            ],
          },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);
      const testimonials = merged.components[0];
      if (testimonials.type !== 'TESTIMONIALS') throw new Error('unreachable');
      expect(testimonials.entries).toEqual([
        { id: 'e2', name: 'Org Person', rating: 5, text: 'Org text' },
      ]);
    });

    it('falls through to the card testimonials entirely when the template component is empty', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'TESTIMONIALS',
            entries: [
              { id: 'e1', name: 'Card Person', rating: 3, text: 'Card text' },
            ],
          },
        ],
      });
      const template = makeTemplate({
        components: [{ id: 't1', order: 0, type: 'TESTIMONIALS', entries: [] }],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);
      const testimonials = merged.components[0];
      if (testimonials.type !== 'TESTIMONIALS') throw new Error('unreachable');
      expect(testimonials.entries).toEqual([
        { id: 'e1', name: 'Card Person', rating: 3, text: 'Card text' },
      ]);
    });
  });

  describe('component structure — the template is the definitive "uniform"', () => {
    it('injects an org-only component type the card never had', () => {
      const card = makeCard({ components: [] });
      const template = makeTemplate({
        components: [
          {
            id: 't1',
            order: 0,
            type: 'WHATSAPP',
            phoneCountryDialCode: '91',
            phoneNumber: '9876543210',
          },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      expect(merged.components.map((c) => c.type)).toEqual(['WHATSAPP']);
    });

    it('excludes a card-only component type the template does not include, even though the card has data for it', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'ABOUT',
            profession: 'Engineer',
            shortNote: null,
            description: null,
            aboutMe: null,
          },
          {
            id: 'c2',
            order: 1,
            type: 'BROCHURE',
            pdfMediaId: 'card-pdf',
            pdfUrl: '/card.pdf',
            fileName: 'card.pdf',
          },
        ],
      });
      const template = makeTemplate({
        components: [
          {
            id: 't1',
            order: 0,
            type: 'ABOUT',
            profession: null,
            shortNote: null,
            description: null,
            aboutMe: null,
          },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      // BROCHURE is the card's own, but the template's uniform doesn't
      // include it — it must not render, mirroring the exact scenario of
      // a SPOC removing a section from the org policy.
      expect(merged.components.map((c) => c.type)).toEqual(['ABOUT']);
    });

    it('injects a template-only VIDEO_GALLERY the card never had', () => {
      const card = makeCard({ components: [] });
      const template = makeTemplate({
        components: [
          {
            id: 't1',
            order: 0,
            type: 'VIDEO_GALLERY',
            subGalleries: [
              {
                id: 'sg1',
                title: 'Org video gallery',
                videos: [
                  {
                    videoUrl: 'https://www.youtube.com/embed/abc123',
                    caption: null,
                  },
                ],
              },
            ],
          },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      expect(merged.components.map((c) => c.type)).toEqual(['VIDEO_GALLERY']);
    });

    it('excludes a card-only VIDEO_GALLERY the template does not include, even though the card has data for it', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'VIDEO_GALLERY',
            subGalleries: [
              { id: 'sg1', title: 'Card video gallery', videos: [] },
            ],
          },
        ],
      });
      const template = makeTemplate({ components: [] });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      expect(merged.components).toEqual([]);
    });

    it('renders no components at all when the template defines none, even if the card has its own', () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'ABOUT',
            profession: 'Engineer',
            shortNote: null,
            description: null,
            aboutMe: null,
          },
        ],
      });
      const template = makeTemplate({ components: [] });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      expect(merged.components).toEqual([]);
    });

    it("orders the merged components by the template's own order, not the card's", () => {
      const card = makeCard({
        components: [
          {
            id: 'c1',
            order: 0,
            type: 'ABOUT',
            profession: null,
            shortNote: null,
            description: null,
            aboutMe: null,
          },
          {
            id: 'c2',
            order: 1,
            type: 'WHATSAPP',
            phoneCountryDialCode: '1',
            phoneNumber: '5551234',
          },
        ],
      });
      const template = makeTemplate({
        components: [
          {
            id: 't1',
            order: 0,
            type: 'WHATSAPP',
            phoneCountryDialCode: '91',
            phoneNumber: null,
          },
          {
            id: 't2',
            order: 1,
            type: 'ABOUT',
            profession: null,
            shortNote: null,
            description: null,
            aboutMe: null,
          },
        ],
      });

      const merged = mergeOrganisationEcardTemplateOntoCard(card, template);

      expect(merged.components.map((c) => c.type)).toEqual([
        'WHATSAPP',
        'ABOUT',
      ]);
      expect(merged.components.map((c) => c.order)).toEqual([0, 1]);
    });
  });
});
