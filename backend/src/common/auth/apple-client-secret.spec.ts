// `jose` ships ESM-only and isn't transformable under this project's Jest
// config without destabilizing unrelated suites that load better-auth's own
// (differently-bundled) internal reference to jose. Mocking at the boundary
// avoids ever loading the real package, and is the more correct unit-test
// shape anyway: this verifies generateAppleClientSecret's own logic/wiring,
// not jose's cryptography.
const mockJwtInstance = {
  setProtectedHeader: jest.fn().mockReturnThis(),
  setIssuer: jest.fn().mockReturnThis(),
  setSubject: jest.fn().mockReturnThis(),
  setAudience: jest.fn().mockReturnThis(),
  // Parameter typed explicitly (unlike its siblings above) since the test
  // reads back its call argument below to assert setExpirationTime's
  // relative offset — the return type is left as `unknown` rather than
  // `typeof mockJwtInstance` purely to avoid circular self-reference in this
  // object's own initializer; the runtime behavior (returning `this`) is
  // unaffected by that, and this test never relies on the static return type.
  setIssuedAt: jest.fn<unknown, [number]>().mockReturnThis(),
  setExpirationTime: jest.fn().mockReturnThis(),
  sign: jest.fn().mockResolvedValue('signed.jwt.token'),
};
// SignJWT must stay a real (non-arrow) function — the real code invokes it
// with `new`, which arrow functions can't support.
const mockSignJWT = jest.fn().mockImplementation(function SignJWT() {
  return mockJwtInstance;
});
const mockImportPKCS8 = jest.fn().mockResolvedValue('mock-key');

jest.mock('jose', () => ({
  importPKCS8: mockImportPKCS8,
  SignJWT: mockSignJWT,
}));

import { generateAppleClientSecret } from './apple-client-secret';
import {
  APPLE_CLIENT_SECRET_ALGORITHM,
  APPLE_CLIENT_SECRET_AUDIENCE,
  APPLE_CLIENT_SECRET_TTL_SECONDS,
} from './auth.constants';

describe('generateAppleClientSecret (unit)', () => {
  const clientId = 'com.example.app.service';
  const teamId = 'ABCDE12345';
  const keyId = 'XYZKEY9876';
  const privateKey =
    '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----';

  beforeEach(() => {
    // clearAllMocks resets call history only, not the return-value/
    // implementation set on each mock above, so those survive.
    jest.clearAllMocks();
  });

  it('imports the private key as ES256 PKCS8', async () => {
    await generateAppleClientSecret({ clientId, teamId, keyId, privateKey });

    expect(mockImportPKCS8).toHaveBeenCalledWith(
      privateKey,
      APPLE_CLIENT_SECRET_ALGORITHM,
    );
  });

  it('signs a JWT with the expected header and claims', async () => {
    const before = Math.floor(Date.now() / 1000);

    const result = await generateAppleClientSecret({
      clientId,
      teamId,
      keyId,
      privateKey,
    });

    expect(mockJwtInstance.setProtectedHeader).toHaveBeenCalledWith({
      alg: APPLE_CLIENT_SECRET_ALGORITHM,
      kid: keyId,
    });
    expect(mockJwtInstance.setIssuer).toHaveBeenCalledWith(teamId);
    expect(mockJwtInstance.setSubject).toHaveBeenCalledWith(clientId);
    expect(mockJwtInstance.setAudience).toHaveBeenCalledWith(
      APPLE_CLIENT_SECRET_AUDIENCE,
    );

    const issuedAt = mockJwtInstance.setIssuedAt.mock.calls[0][0];
    expect(issuedAt).toBeGreaterThanOrEqual(before);
    expect(mockJwtInstance.setExpirationTime).toHaveBeenCalledWith(
      issuedAt + APPLE_CLIENT_SECRET_TTL_SECONDS,
    );
    expect(mockJwtInstance.sign).toHaveBeenCalledWith('mock-key');
    expect(result).toBe('signed.jwt.token');
  });
});
