import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url(),

  BETTER_AUTH_STAFF_SECRET: z.string().min(32),
  BETTER_AUTH_CUSTOMER_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // The public-facing origin the app is served from (e.g. the nginx-fronted
  // host in prod) — used to build absolute URLs (canonical page links, OG
  // image URLs) that crawlers require. Distinct from BETTER_AUTH_URL, which
  // is an auth-specific concept.
  PUBLIC_APP_BASE_URL: z.string().url(),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z.enum(['true', 'false']).transform((value) => value === 'true'),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: z.string().email(),

  MINIO_ENDPOINT: z.string().url(),
  MINIO_REGION: z.string().min(1).default('us-east-1'),
  MINIO_ACCESS_KEY_ID: z.string().min(1),
  MINIO_SECRET_ACCESS_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),

  // Not required — the "Add to Google Wallet" feature is optional
  // infrastructure that isn't provisioned in every environment yet. Left
  // unset, EcardGoogleWalletService throws a clear config error when called
  // rather than the app failing to boot.
  GOOGLE_WALLET_ISSUER_ID: z.string().optional(),
  GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_WALLET_PRIVATE_KEY: z.string().optional(),

  // Not required — same reasoning as the Google Wallet vars above, for the
  // "Add to Apple Wallet" feature. APPLE_WALLET_KEY_PASSPHRASE is optional
  // even among these, since not every Pass Type Certificate private key is
  // passphrase-protected.
  APPLE_WALLET_PASS_TYPE_ID: z.string().optional(),
  APPLE_WALLET_TEAM_ID: z.string().optional(),
  APPLE_WALLET_CERT_PEM: z.string().optional(),
  APPLE_WALLET_KEY_PEM: z.string().optional(),
  APPLE_WALLET_WWDR_PEM: z.string().optional(),
  APPLE_WALLET_KEY_PASSPHRASE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
