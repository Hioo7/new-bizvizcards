import { randomUUID } from 'crypto';
import { ECardTrafficSource } from '../../../generated/prisma/client';
import { DEFAULT_ECARD_EVENT_ATTRIBUTION } from '../ecard-analytics.constants';
import { resolveEcardTrafficSource } from './resolve-ecard-traffic-source.util';

describe('resolveEcardTrafficSource', () => {
  it('resolves a known token + ref id to the matching source', () => {
    const refId = randomUUID();

    expect(resolveEcardTrafficSource('virtual-background', refId)).toEqual({
      source: ECardTrafficSource.VIRTUAL_BACKGROUND,
      sourceRefId: refId,
    });
  });

  it('degrades to DIRECT when both params are absent', () => {
    expect(resolveEcardTrafficSource(undefined, undefined)).toBe(
      DEFAULT_ECARD_EVENT_ATTRIBUTION,
    );
  });

  it('degrades to DIRECT for an unrecognised token', () => {
    expect(resolveEcardTrafficSource('email-signature', randomUUID())).toBe(
      DEFAULT_ECARD_EVENT_ATTRIBUTION,
    );
  });

  it('degrades to DIRECT when the token is present but the ref id is missing', () => {
    expect(resolveEcardTrafficSource('virtual-background', undefined)).toBe(
      DEFAULT_ECARD_EVENT_ATTRIBUTION,
    );
  });

  it('degrades to DIRECT when the ref id is present but the token is missing', () => {
    expect(resolveEcardTrafficSource(undefined, randomUUID())).toBe(
      DEFAULT_ECARD_EVENT_ATTRIBUTION,
    );
  });
});
