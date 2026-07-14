import { ServiceUnavailableException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import type { PublicEcard } from './ecards.service';
import { EcardAppleWalletService } from './ecard-apple-wallet.service';

interface CapturedPkPassCall {
  buffers: Record<string, Buffer>;
  certificates: Record<string, unknown>;
}

interface ParsedPassField {
  key: string;
  label?: string;
  value: string;
  attributedValue?: string;
}

interface ParsedPassJson {
  serialNumber: string;
  barcodes: { format: string; message: string; messageEncoding: string }[];
  generic: {
    primaryFields: ParsedPassField[];
    secondaryFields: ParsedPassField[];
    backFields: ParsedPassField[];
  };
}

let capturedCall: CapturedPkPassCall | null = null;
const getAsBufferMock = jest.fn().mockReturnValue(Buffer.from('pkpass-bytes'));

jest.mock('passkit-generator', () => ({
  PKPass: jest
    .fn()
    .mockImplementation(
      (
        buffers: Record<string, Buffer>,
        certificates: Record<string, unknown>,
      ) => {
        capturedCall = { buffers, certificates };
        return { getAsBuffer: getAsBufferMock };
      },
    ),
}));

function createAppConfigStub(
  overrides: Partial<{
    appleWalletPassTypeId: string | undefined;
    appleWalletTeamId: string | undefined;
    appleWalletCertPem: string | undefined;
    appleWalletKeyPem: string | undefined;
    appleWalletWwdrPem: string | undefined;
    appleWalletKeyPassphrase: string | undefined;
  }> = {},
): AppConfigService {
  return {
    publicAppBaseUrl: 'https://app.example.com',
    appleWalletPassTypeId: 'pass.com.example.bizcard',
    appleWalletTeamId: 'ABCDE12345',
    appleWalletCertPem:
      '-----BEGIN CERTIFICATE-----\ncert\n-----END CERTIFICATE-----',
    appleWalletKeyPem:
      '-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----',
    appleWalletWwdrPem:
      '-----BEGIN CERTIFICATE-----\nwwdr\n-----END CERTIFICATE-----',
    appleWalletKeyPassphrase: undefined,
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

function parsePassJson(): ParsedPassJson {
  return JSON.parse(
    capturedCall!.buffers['pass.json'].toString(),
  ) as ParsedPassJson;
}

describe('EcardAppleWalletService', () => {
  beforeEach(() => {
    capturedCall = null;
    getAsBufferMock.mockClear();
  });

  describe('buildPass', () => {
    it('throws when Apple Wallet env vars are unset', () => {
      const service = new EcardAppleWalletService(
        createAppConfigStub({ appleWalletPassTypeId: undefined }),
      );

      expect(() => service.buildPass(makeCard())).toThrow(
        ServiceUnavailableException,
      );
    });

    it('does not throw when only the (optional) passphrase is missing', () => {
      const service = new EcardAppleWalletService(
        createAppConfigStub({ appleWalletKeyPassphrase: undefined }),
      );

      expect(service.buildPass(makeCard())).toBeInstanceOf(Buffer);
    });

    it('returns the buffer produced by PKPass.getAsBuffer', () => {
      const service = new EcardAppleWalletService(createAppConfigStub());

      const buffer = service.buildPass(makeCard());

      expect(buffer.toString()).toBe('pkpass-bytes');
    });

    it('includes the bundled icon/logo assets', () => {
      const service = new EcardAppleWalletService(createAppConfigStub());

      service.buildPass(makeCard());

      expect(capturedCall?.buffers['icon.png']).toBeInstanceOf(Buffer);
      expect(capturedCall?.buffers['icon@2x.png']).toBeInstanceOf(Buffer);
      expect(capturedCall?.buffers['icon@3x.png']).toBeInstanceOf(Buffer);
      expect(capturedCall?.buffers['logo.png']).toBeInstanceOf(Buffer);
      expect(capturedCall?.buffers['logo@2x.png']).toBeInstanceOf(Buffer);
      expect(capturedCall?.buffers['logo@3x.png']).toBeInstanceOf(Buffer);
    });

    it('passes certificates (newline-unescaped) and the optional passphrase through', () => {
      const service = new EcardAppleWalletService(
        createAppConfigStub({
          appleWalletCertPem: 'cert\\nline2',
          appleWalletKeyPassphrase: 'secret',
        }),
      );

      service.buildPass(makeCard());

      expect(capturedCall?.certificates).toMatchObject({
        signerCert: 'cert\nline2',
        signerKeyPassphrase: 'secret',
      });
    });

    it('includes name, company, email, phone, link, and barcode in pass.json', () => {
      const service = new EcardAppleWalletService(createAppConfigStub());
      const card = makeCard({
        phoneCountryDialCode: '1',
        phoneNumber: '5551234567',
      });

      service.buildPass(card);
      const passJson = parsePassJson();

      expect(passJson.serialNumber).toBe('jane-doe');
      expect(passJson.generic.primaryFields).toEqual([
        { key: 'name', value: 'Jane Doe' },
      ]);
      expect(passJson.generic.secondaryFields).toEqual(
        expect.arrayContaining([
          { key: 'company', label: 'Company', value: 'Acme Co' },
          { key: 'email', label: 'Email', value: 'jane@acme.test' },
        ]),
      );
      expect(passJson.generic.backFields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'phone',
            value: '+1 5551234567',
          }),
          expect.objectContaining({
            key: 'ecard_link',
            value: 'https://app.example.com/ecard/jane-doe',
          }),
        ]),
      );
      expect(passJson.barcodes).toEqual([
        {
          format: 'PKBarcodeFormatQR',
          message: 'https://app.example.com/ecard/jane-doe',
          messageEncoding: 'iso-8859-1',
        },
      ]);
    });

    it('omits company/email/phone fields cleanly when the source data is missing', () => {
      const service = new EcardAppleWalletService(createAppConfigStub());
      const card = makeCard({ companyName: null, email: '' });

      service.buildPass(card);
      const passJson = parsePassJson();

      expect(passJson.generic.secondaryFields).toEqual([]);
      expect(passJson.generic.backFields).toHaveLength(1);
      expect(passJson.generic.backFields[0].key).toBe('ecard_link');
    });
  });
});
