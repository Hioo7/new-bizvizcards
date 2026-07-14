import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleAuth } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { AppConfigService } from '../../../common/config/app-config.service';
import { toAbsoluteUrl } from '../../../common/utils/absolute-url.util';
import {
  ECARD_GENERIC_LABEL,
  ECARD_WALLET_BRAND_COLOR_HEX,
} from '../ecards.constants';
import { ECARD_PUBLIC_PAGE_PATH_PREFIX } from '../ecard-og-preview.constants';
import {
  GOOGLE_WALLET_API_BASE_URL,
  GOOGLE_WALLET_ISSUER_SCOPE,
  GOOGLE_WALLET_SAVE_BASE_URL,
  googleWalletClassId,
  googleWalletObjectId,
} from '../ecard-google-wallet.constants';
import type { PublicEcard } from './ecards.service';

interface GoogleWalletCredentials {
  issuerId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

@Injectable()
export class EcardGoogleWalletService {
  constructor(private readonly appConfig: AppConfigService) {}

  async buildSaveUrl(card: PublicEcard): Promise<string> {
    const credentials = this.requireCredentials();
    await this.ensureClass(credentials);

    const genericObject = this.buildGenericObject(card, credentials.issuerId);
    const token = jwt.sign(
      {
        iss: credentials.serviceAccountEmail,
        aud: 'google',
        typ: 'savetowallet',
        payload: { genericObjects: [genericObject] },
      },
      credentials.privateKey,
      { algorithm: 'RS256' },
    );

    return `${GOOGLE_WALLET_SAVE_BASE_URL}/${token}`;
  }

  private requireCredentials(): GoogleWalletCredentials {
    const issuerId = this.appConfig.googleWalletIssuerId;
    const serviceAccountEmail = this.appConfig.googleWalletServiceAccountEmail;
    const rawPrivateKey = this.appConfig.googleWalletPrivateKey;

    if (!issuerId || !serviceAccountEmail || !rawPrivateKey) {
      throw new ServiceUnavailableException('Google Wallet is not configured');
    }

    return {
      issuerId,
      serviceAccountEmail,
      privateKey: rawPrivateKey.replace(/\\n/g, '\n'),
    };
  }

  private async ensureClass(
    credentials: GoogleWalletCredentials,
  ): Promise<void> {
    const auth = new GoogleAuth({
      credentials: {
        client_email: credentials.serviceAccountEmail,
        private_key: credentials.privateKey,
      },
      scopes: [GOOGLE_WALLET_ISSUER_SCOPE],
    });
    const client = await auth.getClient();
    const classId = googleWalletClassId(credentials.issuerId);

    const getResponse = await client.request({
      url: `${GOOGLE_WALLET_API_BASE_URL}/genericClass/${classId}`,
      method: 'GET',
      validateStatus: () => true,
    });
    if (getResponse.status === 200) {
      return;
    }

    const createResponse = await client.request({
      url: `${GOOGLE_WALLET_API_BASE_URL}/genericClass`,
      method: 'POST',
      data: { id: classId },
      validateStatus: () => true,
    });
    // A 409 means another concurrent request already created it — that's a
    // successful outcome too, not an error.
    if (createResponse.status !== 200 && createResponse.status !== 409) {
      throw new ServiceUnavailableException(
        'Failed to provision the Google Wallet pass class',
      );
    }
  }

  private buildGenericObject(
    card: PublicEcard,
    issuerId: string,
  ): Record<string, unknown> {
    const cardUrl = toAbsoluteUrl(
      this.appConfig.publicAppBaseUrl,
      `${ECARD_PUBLIC_PAGE_PATH_PREFIX}/${card.endpoint}`,
    );

    const textModulesData: { id: string; header: string; body: string }[] = [];
    if (card.hero.email) {
      textModulesData.push({
        id: 'email',
        header: 'Email',
        body: card.hero.email,
      });
    }
    if (card.hero.phoneCountryDialCode && card.hero.phoneNumber) {
      textModulesData.push({
        id: 'phone',
        header: 'Phone',
        body: `+${card.hero.phoneCountryDialCode} ${card.hero.phoneNumber}`,
      });
    }

    const genericObject: Record<string, unknown> = {
      id: googleWalletObjectId(issuerId, card.endpoint),
      classId: googleWalletClassId(issuerId),
      genericType: 'GENERIC_TYPE_UNSPECIFIED',
      cardTitle: {
        defaultValue: { language: 'en', value: ECARD_GENERIC_LABEL },
      },
      header: {
        defaultValue: { language: 'en', value: card.hero.name },
      },
      hexBackgroundColor: ECARD_WALLET_BRAND_COLOR_HEX,
      textModulesData,
      linksModuleData: {
        uris: [
          { uri: cardUrl, description: 'View Digital Card', id: 'view_card' },
        ],
      },
      // Fix vs. legacy: the pass is now actually scannable back to the card.
      barcode: { type: 'QR_CODE', value: cardUrl },
    };

    if (card.hero.companyName) {
      genericObject.subheader = {
        defaultValue: { language: 'en', value: card.hero.companyName },
      };
    }

    // Fix vs. legacy: the card holder's photo is now sent as the pass image.
    if (card.hero.profilePhotoUrl) {
      const imageUri = toAbsoluteUrl(
        this.appConfig.publicAppBaseUrl,
        card.hero.profilePhotoUrl,
      );
      genericObject.heroImage = { sourceUri: { uri: imageUri } };
      genericObject.logo = { sourceUri: { uri: imageUri } };
    }

    return genericObject;
  }
}
