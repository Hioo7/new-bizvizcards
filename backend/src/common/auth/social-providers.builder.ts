// `betterAuth` is imported as a type only — this file builds the
// `socialProviders` config object but never calls betterAuth() itself, so it
// has no need to load the real (ESM-only, Jest-hostile) runtime module. That
// keeps this pure config-building logic unit-testable in isolation from the
// DB-backed auth server itself (see customer-auth.factory.ts, which does the
// actual betterAuth() call and is covered by its own integration spec).
import type { betterAuth } from 'better-auth';
import { generateAppleClientSecret } from './apple-client-secret';

export interface SocialProvidersDeps {
  googleClientId?: string;
  googleClientSecret?: string;
  appleClientId?: string;
  appleTeamId?: string;
  appleKeyId?: string;
  applePrivateKey?: string;
  appleAppBundleIdentifier?: string;
}

export type SocialProviders = Parameters<
  typeof betterAuth
>[0]['socialProviders'];

export function buildSocialProviders(
  deps: SocialProvidersDeps,
): SocialProviders {
  const providers: SocialProviders = {};

  if (deps.googleClientId && deps.googleClientSecret) {
    providers.google = {
      clientId: deps.googleClientId,
      clientSecret: deps.googleClientSecret,
    };
  }

  if (
    deps.appleClientId &&
    deps.appleTeamId &&
    deps.appleKeyId &&
    deps.applePrivateKey
  ) {
    const { appleClientId, appleTeamId, appleKeyId, applePrivateKey } = deps;
    providers.apple = async () => ({
      clientId: appleClientId,
      clientSecret: await generateAppleClientSecret({
        clientId: appleClientId,
        teamId: appleTeamId,
        keyId: appleKeyId,
        privateKey: applePrivateKey,
      }),
      appBundleIdentifier: deps.appleAppBundleIdentifier,
    });
  }

  return providers;
}
