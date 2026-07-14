import { generateKeyPairSync } from 'crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AppConfigService } from '../../../common/config/app-config.service';
import type { PublicEcard } from './ecards.service';
import { EcardGoogleWalletService } from './ecard-google-wallet.service';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

interface WalletRequestOptions {
  method: string;
  url: string;
  data?: unknown;
}

const requestMock = jest.fn<
  Promise<{ status: number }>,
  [WalletRequestOptions]
>();
const getClientMock = jest.fn().mockResolvedValue({ request: requestMock });

jest.mock('google-auth-library', () => ({
  GoogleAuth: jest
    .fn()
    .mockImplementation(() => ({ getClient: getClientMock })),
}));

function createAppConfigStub(
  overrides: Partial<{
    googleWalletIssuerId: string | undefined;
    googleWalletServiceAccountEmail: string | undefined;
    googleWalletPrivateKey: string | undefined;
  }> = {},
): AppConfigService {
  return {
    publicAppBaseUrl: 'https://app.example.com',
    googleWalletIssuerId: 'issuer-1',
    googleWalletServiceAccountEmail: 'wallet@example.iam.gserviceaccount.com',
    googleWalletPrivateKey: privateKey,
    ...overrides,
  } as unknown as AppConfigService;
}

function makeCard(hero: Partial<PublicEcard['hero']> = {}): PublicEcard {
  return {
    id: 'card-id',
    endpoint: 'jane-doe',
    customerId: 'customer-id',
    organisationId: null,
    createdByEmployeeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    hero: {
      name: 'Jane Doe',
      email: 'jane@acme.test',
      companyName: 'Acme Co',
      profilePhotoMediaId: null,
      profilePhotoUrl: null,
      phoneCountryDialCode: null,
      phoneNumber: null,
      isExchangeContactEnabled: true,
      ...hero,
    },
    components: [],
  };
}

interface GenericObjectSaveJwt {
  payload: { genericObjects: Record<string, unknown>[] };
}

function decodePayload(url: string): GenericObjectSaveJwt {
  const token = url.replace('https://pay.google.com/gp/v/save/', '');
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
  }) as unknown as GenericObjectSaveJwt;
}

describe('EcardGoogleWalletService', () => {
  beforeEach(() => {
    requestMock.mockReset();
    getClientMock.mockClear();
  });

  describe('buildSaveUrl', () => {
    it('throws when Google Wallet env vars are unset', async () => {
      const service = new EcardGoogleWalletService(
        createAppConfigStub({ googleWalletIssuerId: undefined }),
      );

      await expect(service.buildSaveUrl(makeCard())).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(getClientMock).not.toHaveBeenCalled();
    });

    it('returns a pay.google.com save URL when the class already exists', async () => {
      requestMock.mockResolvedValueOnce({ status: 200 });
      const service = new EcardGoogleWalletService(createAppConfigStub());

      const url = await service.buildSaveUrl(makeCard());

      expect(url).toMatch(/^https:\/\/pay\.google\.com\/gp\/v\/save\/.+/);
      expect(requestMock).toHaveBeenCalledTimes(1);
    });

    it('creates the class when it does not yet exist (404 then 200)', async () => {
      requestMock
        .mockResolvedValueOnce({ status: 404 })
        .mockResolvedValueOnce({ status: 200 });
      const service = new EcardGoogleWalletService(createAppConfigStub());

      await service.buildSaveUrl(makeCard());

      expect(requestMock).toHaveBeenCalledTimes(2);
      expect(requestMock.mock.calls[1][0]).toMatchObject({
        method: 'POST',
      });
    });

    it('treats a racing 409 on class creation as success', async () => {
      requestMock
        .mockResolvedValueOnce({ status: 404 })
        .mockResolvedValueOnce({ status: 409 });
      const service = new EcardGoogleWalletService(createAppConfigStub());

      await expect(service.buildSaveUrl(makeCard())).resolves.toMatch(
        /^https:\/\/pay\.google\.com\/gp\/v\/save\//,
      );
    });

    it('throws when class creation fails with an unexpected status', async () => {
      requestMock
        .mockResolvedValueOnce({ status: 404 })
        .mockResolvedValueOnce({ status: 500 });
      const service = new EcardGoogleWalletService(createAppConfigStub());

      await expect(service.buildSaveUrl(makeCard())).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('includes name, company, email, phone, link, image, and barcode in the pass', async () => {
      requestMock.mockResolvedValueOnce({ status: 200 });
      const service = new EcardGoogleWalletService(createAppConfigStub());
      const card = makeCard({
        phoneCountryDialCode: '1',
        phoneNumber: '5551234567',
        profilePhotoUrl: '/media/bucket/photo.png',
      });

      const url = await service.buildSaveUrl(card);
      const decoded = decodePayload(url);
      const genericObject = decoded.payload.genericObjects[0];

      expect(genericObject).toMatchObject({
        header: { defaultValue: { language: 'en', value: 'Jane Doe' } },
        subheader: { defaultValue: { language: 'en', value: 'Acme Co' } },
        cardTitle: {
          defaultValue: { language: 'en', value: 'Digital Business Card' },
        },
        linksModuleData: {
          uris: [
            expect.objectContaining({
              uri: 'https://app.example.com/ecard/jane-doe',
            }),
          ],
        },
        barcode: {
          type: 'QR_CODE',
          value: 'https://app.example.com/ecard/jane-doe',
        },
        heroImage: {
          sourceUri: { uri: 'https://app.example.com/media/bucket/photo.png' },
        },
        logo: {
          sourceUri: { uri: 'https://app.example.com/media/bucket/photo.png' },
        },
      });
      expect(genericObject.textModulesData).toEqual(
        expect.arrayContaining([
          { id: 'email', header: 'Email', body: 'jane@acme.test' },
          { id: 'phone', header: 'Phone', body: '+1 5551234567' },
        ]),
      );
    });

    it('omits company, phone, and image fields cleanly when the source data is missing', async () => {
      requestMock.mockResolvedValueOnce({ status: 200 });
      const service = new EcardGoogleWalletService(createAppConfigStub());
      const card = makeCard({ companyName: null, email: '' });

      const url = await service.buildSaveUrl(card);
      const decoded = decodePayload(url);
      const genericObject = decoded.payload.genericObjects[0];

      expect(genericObject.subheader).toBeUndefined();
      expect(genericObject.heroImage).toBeUndefined();
      expect(genericObject.logo).toBeUndefined();
      expect(genericObject.textModulesData).toEqual([]);
    });
  });
});
