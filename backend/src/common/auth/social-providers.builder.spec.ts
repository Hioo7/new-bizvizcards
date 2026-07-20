// Transitively imported via apple-client-secret.ts — see apple-client-secret.spec.ts
// for why jose is mocked rather than loaded for real under this Jest config.
jest.mock('jose', () => ({
  importPKCS8: jest.fn(),
  SignJWT: jest.fn(),
}));

import { buildSocialProviders } from './social-providers.builder';
import type { SocialProvidersDeps } from './social-providers.builder';

const baseDeps: SocialProvidersDeps = {};

const googleDeps = {
  googleClientId: 'google-client-id',
  googleClientSecret: 'google-client-secret',
};

const appleDeps = {
  appleClientId: 'apple-client-id',
  appleTeamId: 'apple-team-id',
  appleKeyId: 'apple-key-id',
  applePrivateKey:
    '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
};

describe('buildSocialProviders (unit)', () => {
  it('returns no providers when nothing is configured', () => {
    expect(buildSocialProviders(baseDeps)).toEqual({});
  });

  it('registers only google when only google fields are present', () => {
    const providers = buildSocialProviders({ ...baseDeps, ...googleDeps });
    expect(providers?.google).toEqual({
      clientId: googleDeps.googleClientId,
      clientSecret: googleDeps.googleClientSecret,
    });
    expect(providers?.apple).toBeUndefined();
  });

  it('registers only apple when all apple fields are present', () => {
    const providers = buildSocialProviders({ ...baseDeps, ...appleDeps });
    expect(providers?.google).toBeUndefined();
    expect(typeof providers?.apple).toBe('function');
  });

  it('does not register apple when any required apple field is missing', () => {
    const providers = buildSocialProviders({
      ...baseDeps,
      appleClientId: appleDeps.appleClientId,
      appleTeamId: appleDeps.appleTeamId,
      appleKeyId: appleDeps.appleKeyId,
      // applePrivateKey intentionally omitted
    });
    expect(providers?.apple).toBeUndefined();
  });

  it('registers both providers when both are fully configured', () => {
    const providers = buildSocialProviders({
      ...baseDeps,
      ...googleDeps,
      ...appleDeps,
    });
    expect(providers?.google).toBeDefined();
    expect(typeof providers?.apple).toBe('function');
  });
});
