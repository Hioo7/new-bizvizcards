import { importPKCS8, SignJWT } from 'jose';
import {
  APPLE_CLIENT_SECRET_ALGORITHM,
  APPLE_CLIENT_SECRET_AUDIENCE,
  APPLE_CLIENT_SECRET_TTL_SECONDS,
} from './auth.constants';

export interface GenerateAppleClientSecretParams {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
}

// "Sign in with Apple" has no static client secret — Apple instead requires a
// short-lived JWT, signed with the private key from a "Sign in with Apple"
// key (.p8), presented as the client secret on every token exchange. This
// mirrors better-auth's own documented pattern for the `apple` social
// provider (see docs/authentication/apple.mdx).
export async function generateAppleClientSecret({
  clientId,
  teamId,
  keyId,
  privateKey,
}: GenerateAppleClientSecretParams): Promise<string> {
  const key = await importPKCS8(privateKey, APPLE_CLIENT_SECRET_ALGORITHM);
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: APPLE_CLIENT_SECRET_ALGORITHM, kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience(APPLE_CLIENT_SECRET_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + APPLE_CLIENT_SECRET_TTL_SECONDS)
    .sign(key);
}
