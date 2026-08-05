import {
  EmailSignatureSocialPlatform,
  EmailSignatureTemplateKey,
} from '../../../generated/prisma/client';
import { emailSignatureRendererRegistry } from './email-signature-renderer-registry';
import type { EmailSignatureRenderInput } from './email-signature-renderer.interface';

// Checklist: every EmailSignatureTemplateKey resolves to a renderer; every
// renderer escapes dangerous user text (core anti-XSS regression guard);
// every renderer tolerates a minimal input (only fullName) without
// crashing; Minimal's documented omissions (banner, CTA button) never leak
// into its output even when the input provides them; a social link's icon
// image is used when iconUrl is resolved, and CUSTOM (no iconUrl) falls
// back to text instead of a broken <img>.
describe('emailSignatureRendererRegistry', () => {
  it('has a renderer registered for every template key', () => {
    for (const key of Object.values(EmailSignatureTemplateKey)) {
      expect(emailSignatureRendererRegistry[key]).toBeDefined();
    }
  });

  const minimalInput: EmailSignatureRenderInput = {
    fullName: 'Jane Doe',
    socialLinks: [],
  };

  const dangerousInput: EmailSignatureRenderInput = {
    fullName: '<script>alert(1)</script>',
    jobTitle: '"><img src=x onerror=alert(1)>',
    company: 'Acme & Sons <b>Inc</b>',
    email: 'jane@example.com',
    phone: '15551234567',
    website: 'https://example.com',
    address: '1 Main St & Elm Ave',
    ctaText: '<b>Click</b> me',
    ctaUrl: 'javascript:alert(1)',
    profileImageUrl: 'https://cdn.example.com/photo.png',
    companyLogoUrl: 'https://cdn.example.com/logo.png',
    bannerImageUrl: 'https://cdn.example.com/banner.png',
    socialLinks: [
      {
        platform: EmailSignatureSocialPlatform.LINKEDIN,
        url: 'https://linkedin.com/in/jane',
        iconUrl: 'https://cdn.example.com/icons/linkedin.png',
      },
      {
        platform: EmailSignatureSocialPlatform.CUSTOM,
        url: 'https://example.com/blog',
        label: '<script>x</script>',
      },
    ],
  };

  for (const key of Object.values(EmailSignatureTemplateKey)) {
    describe(key, () => {
      const renderer = emailSignatureRendererRegistry[key];

      it('renders a minimal input without crashing', () => {
        expect(() => renderer.render(minimalInput)).not.toThrow();
        expect(renderer.render(minimalInput)).toContain('Jane Doe');
      });

      it('escapes dangerous text and never emits an unsafe URL scheme', () => {
        const html = renderer.render(dangerousInput);
        // The safety property is that HTML metacharacters from user text
        // never appear unescaped — not that specific dangerous *substrings*
        // are absent (e.g. "onerror=alert(1)" as literal escaped text
        // content is inert; the same string as a real, unescaped tag is not).
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<img src=x onerror=alert(1)>');
        expect(html).not.toContain('javascript:alert(1)');
        expect(html).toContain('&lt;script&gt;');
        expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      });
    });
  }

  describe('MinimalEmailSignatureRenderer', () => {
    const renderer =
      emailSignatureRendererRegistry[EmailSignatureTemplateKey.MINIMAL];

    it('never renders the banner image or a CTA button, even when provided', () => {
      const html = renderer.render(dangerousInput);
      expect(html).not.toContain('banner.png');
      expect(html).not.toContain('Click');
    });
  });

  describe('social icon rendering', () => {
    it('uses the icon image when iconUrl is resolved', () => {
      const html =
        emailSignatureRendererRegistry[EmailSignatureTemplateKey.MODERN].render(
          dangerousInput,
        );
      expect(html).toContain('icons/linkedin.png');
    });

    it('falls back to text (not a broken <img>) for a platform with no icon (CUSTOM)', () => {
      const html =
        emailSignatureRendererRegistry[EmailSignatureTemplateKey.MODERN].render(
          dangerousInput,
        );
      // The text-fallback branch in socialLinksRow() renders a <span>, not
      // an <img> — the CUSTOM link in dangerousInput has no iconUrl.
      expect(html).toContain('font-size:11px');
    });
  });
});
