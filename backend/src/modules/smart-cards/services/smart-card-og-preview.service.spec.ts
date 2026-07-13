import { AppConfigService } from '../../../common/config/app-config.service';
import type { MediaService } from '../../../common/media/media.service';
import { SmartCardTemplateKey } from '../../../generated/prisma/client';
import type { PublicSmartCard } from './smart-cards.service';
import { SmartCardOgPreviewService } from './smart-card-og-preview.service';

function makeCard(
  profile: PublicSmartCard['profile'],
  endpoint = 'test-endpoint',
): PublicSmartCard {
  return {
    id: 'card-id',
    endpoint,
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

describe('SmartCardOgPreviewService', () => {
  let appConfig: AppConfigService;
  let fakeMediaService: MediaService;
  let service: SmartCardOgPreviewService;

  beforeAll(() => {
    appConfig = new AppConfigService();
    fakeMediaService = {
      getPublicUrlForKey: (key: string) => `/media/test-bucket/${key}`,
    } as MediaService;
    service = new SmartCardOgPreviewService(fakeMediaService, appConfig);
  });

  describe('buildFields', () => {
    it('passes through the registry-provided image when a logo exists', () => {
      const card = makeCard({
        companyName: 'Acme Co',
        tagline: 'Tagline',
        subTagline: null,
        aboutText: null,
        logoMediaId: 'id',
        logoUrl: '/media/bucket/logo.png',
      });

      const fields = service.buildFields(card);

      expect(fields.imageUrl).toBe('/media/bucket/logo.png');
    });

    it('applies the default fallback image when there is no logo', () => {
      const card = makeCard({
        companyName: 'Acme Co',
        tagline: 'Tagline',
        subTagline: null,
        aboutText: null,
        logoMediaId: null,
        logoUrl: null,
      });

      const fields = service.buildFields(card);

      expect(fields.imageUrl).toBe(
        '/media/test-bucket/defaults/og-preview-fallback.png',
      );
    });
  });

  describe('renderHtml', () => {
    it('produces an absolute canonical URL and image URL, and correct OG/Twitter tags', () => {
      const fields = {
        title: 'Acme Co',
        description: 'We build things',
        imageUrl: '/media/bucket/logo.png',
      };

      const html = service.renderHtml('acme-endpoint', fields);

      expect(html).toContain(`<title>Acme Co</title>`);
      expect(html).toContain(`<meta property="og:title" content="Acme Co" />`);
      expect(html).toContain(
        `<meta property="og:description" content="We build things" />`,
      );
      expect(html).toContain(
        `content="${appConfig.publicAppBaseUrl}/smartcard/acme-endpoint"`,
      );
      expect(html).toContain(
        `content="${appConfig.publicAppBaseUrl}/media/bucket/logo.png"`,
      );
      expect(html).toContain('twitter:card" content="summary_large_image"');
    });

    it('HTML-escapes dynamic text to prevent markup/attribute injection', () => {
      const fields = {
        title: `Acme "Co" <script>alert(1)</script>`,
        description: `Tagline & more`,
        imageUrl: '/media/bucket/logo.png',
      };

      const html = service.renderHtml('acme-endpoint', fields);

      expect(html).not.toContain('<script>');
      expect(html).toContain(
        'Acme &quot;Co&quot; &lt;script&gt;alert(1)&lt;/script&gt;',
      );
      expect(html).toContain('Tagline &amp; more');
    });

    it('leaves an already-absolute image URL untouched', () => {
      const fields = {
        title: 'Acme Co',
        description: 'Tagline',
        imageUrl: 'https://cdn.example.com/logo.png',
      };

      const html = service.renderHtml('acme-endpoint', fields);

      expect(html).toContain('content="https://cdn.example.com/logo.png"');
    });
  });
});
