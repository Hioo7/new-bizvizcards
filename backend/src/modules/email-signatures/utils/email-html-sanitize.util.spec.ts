import { sanitizeUrlForHtmlAttribute } from './email-html-sanitize.util';

// Checklist: allow-listed schemes (http/https/mailto/tel) pass through
// escaped; disallowed schemes (javascript:/data:/other) and malformed URLs
// return undefined; undefined input returns undefined.
describe('sanitizeUrlForHtmlAttribute', () => {
  it.each([
    'https://example.com',
    'http://example.com',
    'mailto:a@b.com',
    'tel:+1234567',
  ])('accepts allow-listed scheme %s', (url) => {
    expect(sanitizeUrlForHtmlAttribute(url)).toBe(url);
  });

  it('escapes special characters in an otherwise-valid URL', () => {
    const url = 'https://example.com/?a=1&b=2';
    expect(sanitizeUrlForHtmlAttribute(url)).toBe(
      'https://example.com/?a=1&amp;b=2',
    );
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://example.com',
    'vbscript:msgbox(1)',
  ])('rejects disallowed scheme %s', (url) => {
    expect(sanitizeUrlForHtmlAttribute(url)).toBeUndefined();
  });

  it('rejects a malformed URL', () => {
    expect(sanitizeUrlForHtmlAttribute('not a url')).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(sanitizeUrlForHtmlAttribute(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(sanitizeUrlForHtmlAttribute('')).toBeUndefined();
  });
});
