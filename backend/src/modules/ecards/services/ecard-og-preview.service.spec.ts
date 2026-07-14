import { AppConfigService } from '../../../common/config/app-config.service';
import type { MediaService } from '../../../common/media/media.service';
import type { PublicEcard } from './ecards.service';
import { EcardOgPreviewService } from './ecard-og-preview.service';
import {
  ECARD_OG_PREVIEW_FALLBACK_TITLE,
  ecardOgPreviewFallbackDescription,
} from '../ecard-og-preview.constants';

function makeCard(
  hero: PublicEcard['hero'],
  endpoint = 'test-endpoint',
): PublicEcard {
  return {
    id: 'card-id',
    endpoint,
    customerId: 'customer-id',
    organisationId: null,
    createdByEmployeeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    hero,
    components: [],
  };
}

describe('EcardOgPreviewService', () => {
  let appConfig: AppConfigService;
  let fakeMediaService: MediaService;
  let service: EcardOgPreviewService;

  beforeAll(() => {
    appConfig = new AppConfigService();
    fakeMediaService = {
      getPublicUrlForKey: (key: string) => `/media/test-bucket/${key}`,
    } as MediaService;
    service = new EcardOgPreviewService(fakeMediaService, appConfig);
  });

  describe('buildFields', () => {
    it('uses the hero name as title and company name as description', () => {
      const card = makeCard({
        name: 'Jane Doe',
        email: 'jane@acme.test',
        companyName: 'Acme Co',
        profilePhotoMediaId: 'media-id',
        profilePhotoUrl: '/media/bucket/photo.png',
        phoneCountryDialCode: '1',
        phoneNumber: '5551234567',
        isExchangeContactEnabled: true,
      });

      const fields = service.buildFields(card);

      expect(fields).toEqual({
        title: 'Jane Doe',
        description: 'Acme Co',
        imageUrl: '/media/bucket/photo.png',
      });
    });

    it('falls back to a generic description when there is no company name', () => {
      const card = makeCard({
        name: 'Jane Doe',
        email: 'jane@acme.test',
        companyName: null,
        profilePhotoMediaId: null,
        profilePhotoUrl: null,
        phoneCountryDialCode: null,
        phoneNumber: null,
        isExchangeContactEnabled: true,
      });

      const fields = service.buildFields(card);

      expect(fields.description).toBe(
        ecardOgPreviewFallbackDescription('Jane Doe'),
      );
    });

    it('applies the default fallback image when there is no profile photo', () => {
      const card = makeCard({
        name: 'Jane Doe',
        email: 'jane@acme.test',
        companyName: 'Acme Co',
        profilePhotoMediaId: null,
        profilePhotoUrl: null,
        phoneCountryDialCode: null,
        phoneNumber: null,
        isExchangeContactEnabled: true,
      });

      const fields = service.buildFields(card);

      expect(fields.imageUrl).toBe(
        '/media/test-bucket/defaults/og-preview-fallback.png',
      );
    });

    it('falls back to a generic title when the hero name is blank', () => {
      const card = makeCard({
        name: '   ',
        email: 'jane@acme.test',
        companyName: null,
        profilePhotoMediaId: null,
        profilePhotoUrl: null,
        phoneCountryDialCode: null,
        phoneNumber: null,
        isExchangeContactEnabled: true,
      });

      const fields = service.buildFields(card);

      expect(fields.title).toBe(ECARD_OG_PREVIEW_FALLBACK_TITLE);
    });
  });

  describe('renderHtml', () => {
    it('produces an absolute canonical URL and image URL, and correct OG/Twitter tags', () => {
      const fields = {
        title: 'Jane Doe',
        description: 'Acme Co',
        imageUrl: '/media/bucket/photo.png',
      };

      const html = service.renderHtml('jane-doe', fields);

      expect(html).toContain(`<title>Jane Doe</title>`);
      expect(html).toContain(`<meta property="og:title" content="Jane Doe" />`);
      expect(html).toContain(
        `<meta property="og:description" content="Acme Co" />`,
      );
      expect(html).toContain(
        `content="${appConfig.publicAppBaseUrl}/ecard/jane-doe"`,
      );
      expect(html).toContain(
        `content="${appConfig.publicAppBaseUrl}/media/bucket/photo.png"`,
      );
      expect(html).toContain('twitter:card" content="summary_large_image"');
    });

    it('HTML-escapes dynamic text to prevent markup/attribute injection', () => {
      const fields = {
        title: `Jane "Doe" <script>alert(1)</script>`,
        description: `Acme & Co`,
        imageUrl: '/media/bucket/photo.png',
      };

      const html = service.renderHtml('jane-doe', fields);

      expect(html).not.toContain('<script>');
      expect(html).toContain(
        'Jane &quot;Doe&quot; &lt;script&gt;alert(1)&lt;/script&gt;',
      );
      expect(html).toContain('Acme &amp; Co');
    });

    it('leaves an already-absolute image URL untouched', () => {
      const fields = {
        title: 'Jane Doe',
        description: 'Acme Co',
        imageUrl: 'https://cdn.example.com/photo.png',
      };

      const html = service.renderHtml('jane-doe', fields);

      expect(html).toContain('content="https://cdn.example.com/photo.png"');
    });
  });
});
