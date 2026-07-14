import { join } from 'path';

// This app's actual product name (already used throughout the frontend —
// Footer.tsx, AuthLayout.tsx, etc.) — not a legacy-only artifact.
export const APPLE_WALLET_ORGANIZATION_NAME = 'BizVizCards';

export const APPLE_WALLET_FOREGROUND_COLOR = 'rgb(255, 255, 255)';
export const APPLE_WALLET_LABEL_COLOR = 'rgb(180, 200, 255)';

export const APPLE_WALLET_BARCODE_FORMAT = 'PKBarcodeFormatQR';
export const APPLE_WALLET_BARCODE_MESSAGE_ENCODING = 'iso-8859-1';

export function appleWalletPassDescription(
  name: string,
  genericLabel: string,
): string {
  return `${name} — ${genericLabel}`;
}

// Real BizVizCards brand assets (see backend/src/modules/ecards/assets/apple-wallet/),
// rasterized from the app icon in legacy-artifacts/cards-app/public/app_icons/
// (bizvizpwalogo-512x512.png) and the logo used on the current landing page
// (frontend/src/assets/brand/bizvizlogo.svg) — a real pass requires at least
// an icon to be valid/installable, which the legacy implementation never
// supplied at all.
export const APPLE_WALLET_ASSETS_DIR = join(
  __dirname,
  'assets',
  'apple-wallet',
);
export const APPLE_WALLET_ASSET_FILENAMES = [
  'icon.png',
  'icon@2x.png',
  'icon@3x.png',
  'logo.png',
  'logo@2x.png',
  'logo@3x.png',
] as const;
