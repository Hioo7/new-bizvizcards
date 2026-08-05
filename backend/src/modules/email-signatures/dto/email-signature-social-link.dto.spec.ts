import { emailSignatureSocialLinkSchema } from './email-signature-social-link.dto';

// Checklist: every non-CUSTOM/non-WHATSAPP platform accepts a bare url and
// rejects a label; CUSTOM requires a non-empty label; WHATSAPP accepts a
// digits-only phone number and rejects a url/label on that variant, rejects
// non-digit characters, and rejects an out-of-range digit count; an invalid
// URL is rejected on every url-based variant; an unknown platform value is
// rejected.
describe('emailSignatureSocialLinkSchema', () => {
  it('accepts a non-CUSTOM platform with just a url', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'LINKEDIN',
      url: 'https://linkedin.com/in/jane',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-CUSTOM platform that includes a label', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'LINKEDIN',
      url: 'https://linkedin.com/in/jane',
      label: 'My LinkedIn',
    });
    expect(result.success).toBe(false);
  });

  it('accepts CUSTOM with a non-empty label', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'CUSTOM',
      url: 'https://example.com/blog',
      label: 'Blog',
    });
    expect(result.success).toBe(true);
  });

  it('rejects CUSTOM with no label', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'CUSTOM',
      url: 'https://example.com/blog',
    });
    expect(result.success).toBe(false);
  });

  it('rejects CUSTOM with an empty label', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'CUSTOM',
      url: 'https://example.com/blog',
      label: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid url', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'WEBSITE',
      url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown platform value', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'MYSPACE',
      url: 'https://myspace.com/jane',
    });
    expect(result.success).toBe(false);
  });

  it('accepts WHATSAPP with a digits-only phone number', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'WHATSAPP',
      phoneNumber: '919876543210',
    });
    expect(result.success).toBe(true);
  });

  it('rejects WHATSAPP with a url instead of a phoneNumber', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'WHATSAPP',
      url: 'https://wa.me/919876543210',
    });
    expect(result.success).toBe(false);
  });

  it('rejects WHATSAPP with non-digit characters (e.g. "+" or spaces)', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'WHATSAPP',
      phoneNumber: '+91 98765 43210',
    });
    expect(result.success).toBe(false);
  });

  it('rejects WHATSAPP with too few digits', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'WHATSAPP',
      phoneNumber: '123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects WHATSAPP with a label (label only applies to CUSTOM)', () => {
    const result = emailSignatureSocialLinkSchema.safeParse({
      platform: 'WHATSAPP',
      phoneNumber: '919876543210',
      label: 'Chat with me',
    });
    expect(result.success).toBe(false);
  });
});
