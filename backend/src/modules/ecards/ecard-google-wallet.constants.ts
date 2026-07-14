export const GOOGLE_WALLET_API_BASE_URL =
  'https://walletobjects.googleapis.com/walletobjects/v1';
export const GOOGLE_WALLET_SAVE_BASE_URL = 'https://pay.google.com/gp/v/save';
export const GOOGLE_WALLET_ISSUER_SCOPE =
  'https://www.googleapis.com/auth/wallet_object.issuer';

// One shared generic pass class for every e-card — only the per-card
// GenericObject differs (see googleWalletObjectId below).
export const GOOGLE_WALLET_GENERIC_CLASS_SUFFIX = 'ecard_business_card';

// Google Wallet object ids only allow a limited character set — anything
// else in the card's endpoint slug is replaced with "_".
export const GOOGLE_WALLET_OBJECT_ID_SANITIZE_PATTERN = /[^a-zA-Z0-9_-]/g;

export function googleWalletClassId(issuerId: string): string {
  return `${issuerId}.${GOOGLE_WALLET_GENERIC_CLASS_SUFFIX}`;
}

export function googleWalletObjectId(
  issuerId: string,
  endpoint: string,
): string {
  const sanitizedEndpoint = endpoint.replace(
    GOOGLE_WALLET_OBJECT_ID_SANITIZE_PATTERN,
    '_',
  );
  return `${issuerId}.${sanitizedEndpoint}`;
}
