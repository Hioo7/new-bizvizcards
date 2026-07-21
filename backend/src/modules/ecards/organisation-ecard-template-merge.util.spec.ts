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
                images: [{ imageMediaId: 'm1', imageUrl: '/m1.png' }],
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
