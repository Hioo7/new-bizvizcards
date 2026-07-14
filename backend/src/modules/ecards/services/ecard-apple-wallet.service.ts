import { readFileSync } from 'fs';
import { join } from 'path';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PKPass } from 'passkit-generator';
import { AppConfigService } from '../../../common/config/app-config.service';
import { hexToRgbString } from '../../../common/utils/hex-color.util';
import { toAbsoluteUrl } from '../../../common/utils/absolute-url.util';
import {
  ECARD_GENERIC_LABEL,
  ECARD_WALLET_BRAND_COLOR_HEX,
} from '../ecards.constants';
import { ECARD_PUBLIC_PAGE_PATH_PREFIX } from '../ecard-og-preview.constants';
import {
  APPLE_WALLET_ASSETS_DIR,
  APPLE_WALLET_ASSET_FILENAMES,
  APPLE_WALLET_BARCODE_FORMAT,
  APPLE_WALLET_BARCODE_MESSAGE_ENCODING,
  APPLE_WALLET_FOREGROUND_COLOR,
  APPLE_WALLET_LABEL_COLOR,
  APPLE_WALLET_ORGANIZATION_NAME,
  appleWalletPassDescription,
} from '../ecard-apple-wallet.constants';
import type { PublicEcard } from './ecards.service';

interface AppleWalletCredentials {
  passTypeId: string;
  teamId: string;
  certPem: string;
  keyPem: string;
  wwdrPem: string;
  keyPassphrase?: string;
}

@Injectable()
export class EcardAppleWalletService {
  constructor(private readonly appConfig: AppConfigService) {}

  buildPass(card: PublicEcard): Buffer {
    const credentials = this.requireCredentials();
    const passJson = this.buildPassJson(card, credentials);

    const buffers: Record<string, Buffer> = {
      'pass.json': Buffer.from(JSON.stringify(passJson)),
    };
    for (const filename of APPLE_WALLET_ASSET_FILENAMES) {
      buffers[filename] = readFileSync(join(APPLE_WALLET_ASSETS_DIR, filename));
    }

    const pass = new PKPass(buffers, {
      wwdr: credentials.wwdrPem,
      signerCert: credentials.certPem,
      signerKey: credentials.keyPem,
      ...(credentials.keyPassphrase && {
        signerKeyPassphrase: credentials.keyPassphrase,
      }),
    });

    return pass.getAsBuffer();
  }

  private requireCredentials(): AppleWalletCredentials {
    const passTypeId = this.appConfig.appleWalletPassTypeId;
    const teamId = this.appConfig.appleWalletTeamId;
    const rawCertPem = this.appConfig.appleWalletCertPem;
    const rawKeyPem = this.appConfig.appleWalletKeyPem;
    const rawWwdrPem = this.appConfig.appleWalletWwdrPem;

    if (!passTypeId || !teamId || !rawCertPem || !rawKeyPem || !rawWwdrPem) {
      throw new ServiceUnavailableException('Apple Wallet is not configured');
    }

    return {
      passTypeId,
      teamId,
      certPem: rawCertPem.replace(/\\n/g, '\n'),
      keyPem: rawKeyPem.replace(/\\n/g, '\n'),
      wwdrPem: rawWwdrPem.replace(/\\n/g, '\n'),
      keyPassphrase: this.appConfig.appleWalletKeyPassphrase,
    };
  }

  private buildPassJson(
    card: PublicEcard,
    credentials: AppleWalletCredentials,
  ): Record<string, unknown> {
    const cardUrl = toAbsoluteUrl(
      this.appConfig.publicAppBaseUrl,
      `${ECARD_PUBLIC_PAGE_PATH_PREFIX}/${card.endpoint}`,
    );

    const secondaryFields: Record<string, unknown>[] = [];
    if (card.hero.companyName) {
      secondaryFields.push({
        key: 'company',
        label: 'Company',
        value: card.hero.companyName,
      });
    }
    if (card.hero.email) {
      secondaryFields.push({
        key: 'email',
        label: 'Email',
        value: card.hero.email,
      });
    }

    const backFields: Record<string, unknown>[] = [
      {
        key: 'ecard_link',
        label: 'Digital Card',
        value: cardUrl,
        attributedValue: `<a href="${cardUrl}">View Digital Card</a>`,
      },
    ];
    if (card.hero.phoneCountryDialCode && card.hero.phoneNumber) {
      backFields.push({
        key: 'phone',
        label: 'Phone',
        value: `+${card.hero.phoneCountryDialCode} ${card.hero.phoneNumber}`,
      });
    }

    return {
      formatVersion: 1,
      passTypeIdentifier: credentials.passTypeId,
      teamIdentifier: credentials.teamId,
      organizationName: APPLE_WALLET_ORGANIZATION_NAME,
      description: appleWalletPassDescription(
        card.hero.name,
        ECARD_GENERIC_LABEL,
      ),
      serialNumber: card.endpoint,
      sharingProhibited: false,
      backgroundColor: hexToRgbString(ECARD_WALLET_BRAND_COLOR_HEX),
      foregroundColor: APPLE_WALLET_FOREGROUND_COLOR,
      labelColor: APPLE_WALLET_LABEL_COLOR,
      barcodes: [
        {
          format: APPLE_WALLET_BARCODE_FORMAT,
          message: cardUrl,
          messageEncoding: APPLE_WALLET_BARCODE_MESSAGE_ENCODING,
        },
      ],
      generic: {
        primaryFields: [{ key: 'name', value: card.hero.name }],
        secondaryFields,
        backFields,
      },
    };
  }
}
