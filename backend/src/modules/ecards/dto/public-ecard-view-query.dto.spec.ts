import { randomUUID } from 'crypto';
import { publicEcardViewQuerySchema } from './public-ecard-view-query.dto';

describe('publicEcardViewQuerySchema', () => {
  it('parses a well-formed src + sref pair', () => {
    const sref = randomUUID();
    const result = publicEcardViewQuerySchema.parse({
      src: 'virtual-background',
      sref,
    });

    expect(result).toEqual({ src: 'virtual-background', sref });
  });

  it('ignores unrelated query params instead of rejecting them', () => {
    const result = publicEcardViewQuerySchema.parse({
      utm_source: 'newsletter',
      fbclid: 'abc123',
    });

    expect(result.src).toBeUndefined();
    expect(result.sref).toBeUndefined();
  });

  it('drops a malformed sref to undefined rather than throwing', () => {
    const result = publicEcardViewQuerySchema.parse({
      src: 'virtual-background',
      sref: 'not-a-uuid',
    });

    expect(result.src).toBe('virtual-background');
    expect(result.sref).toBeUndefined();
  });

  it('accepts an empty query', () => {
    expect(publicEcardViewQuerySchema.parse({})).toEqual({
      src: undefined,
      sref: undefined,
    });
  });
});
