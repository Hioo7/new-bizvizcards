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

  // Comma-separated list of allowed CORS origins (e.g. the Vite dev server
  // origin(s) in development, the production domain in prod).
  CORS_ALLOWED_ORIGINS: z.string().min(1),

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

  // Not required — customer "Sign in with Google" stays disabled (Better Auth
  // simply won't register the provider) until these are provisioned.
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),

  // Not required — same reasoning, for customer "Sign in with Apple".
  // APPLE_OAUTH_CLIENT_ID is Apple's "Services ID"; the client secret isn't a
  // static value but a short-lived JWT signed from the team/key id + private
  // key at request time (see common/auth/apple-client-secret.ts).
  // APPLE_OAUTH_APP_BUNDLE_IDENTIFIER is optional even among these — only
  // needed for native-app (not web) Sign in with Apple verification.
  APPLE_OAUTH_CLIENT_ID: z.string().optional(),
  APPLE_OAUTH_TEAM_ID: z.string().optional(),
  APPLE_OAUTH_KEY_ID: z.string().optional(),
  APPLE_OAUTH_PRIVATE_KEY: z.string().optional(),
  APPLE_OAUTH_APP_BUNDLE_IDENTIFIER: z.string().optional(),

  // Not required for normal app operation — only used by the one-time
  // legacy-data migration tool (src/modules/migration). Left unset outside
  // of an active migration window (e.g. in production after cutover), the
  // migration module's pre-flight checks simply report themselves as failed
  // rather than the app failing to boot. LEGACY_DATABASE_URL points at a
  // read-only role on the legacy Postgres DB, tunneled in for the migration
  // window (see the migration plan). LEGACY_MEDIA_STAGING_BUCKET is the name
  // of a bucket on the SAME MinIO instance/credentials as MINIO_* above that
  // the one-time `mc mirror` bulk copy (Phase A of the media transfer
  // strategy) writes legacy media objects into — read via the app's own S3
  // client during Phase B, then re-uploaded through the normal MediaService
  // into the real MINIO_BUCKET.
  LEGACY_DATABASE_URL: z.string().url().optional(),
  // No .min(1) — matches the GOOGLE_WALLET_*-style optional vars below,
  // which are left as a blank string (not absent) in .env when unconfigured.
  // Consumers treat an empty string as "not set" via a plain falsy check.
  LEGACY_MEDIA_STAGING_BUCKET: z.string().optional(),
  // Only needed to resolve the rare legacy Media row still on
  // source: CLOUDINARY (rather than MINIO or a plain-string URL column) —
  // used to reconstruct that row's public URL from its fileKey (Cloudinary
  // public_id), matching legacy's CloudinaryStorageProvider.getPublicUrl()
  // exactly. Most legacy media resolves via MinIO or the plain-string
  // fallback columns and never needs this.
  LEGACY_CLOUDINARY_CLOUD_NAME: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
