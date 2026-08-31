import { buildEcardTrafficSourceUrl } from './build-ecard-traffic-source-url.util';

describe('buildEcardTrafficSourceUrl', () => {
  it('appends src and sref params to a plain e-card URL', () => {
    const url = buildEcardTrafficSourceUrl(
      'https://cards.example.com/ecard/jane-doe',
      'virtual-background',
      '11111111-1111-1111-1111-111111111111',
    );

    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/ecard/jane-doe');
    expect(parsed.searchParams.get('src')).toBe('virtual-background');
    expect(parsed.searchParams.get('sref')).toBe(
      '11111111-1111-1111-1111-111111111111',
    );
  });

  it('keeps an existing query string and adds the two params alongside it', () => {
    const url = buildEcardTrafficSourceUrl(
      'https://cards.example.com/ecard/jane-doe?utm_source=newsletter',
      'virtual-background',
      '22222222-2222-2222-2222-222222222222',
    );

    const parsed = new URL(url);
    expect(parsed.searchParams.get('utm_source')).toBe('newsletter');
    expect(parsed.searchParams.get('src')).toBe('virtual-background');
    expect(parsed.searchParams.get('sref')).toBe(
      '22222222-2222-2222-2222-222222222222',
    );
  });
});
