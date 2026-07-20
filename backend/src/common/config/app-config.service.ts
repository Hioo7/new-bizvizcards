import { Injectable } from '@nestjs/common';
import { Env, envSchema } from './env.schema';

@Injectable()
export class AppConfigService {
  private readonly env: Env;

  constructor() {
    this.env = envSchema.parse(process.env);
  }

  get nodeEnv(): Env['NODE_ENV'] {
    return this.env.NODE_ENV;
  }

  get port(): number {
    return this.env.PORT;
  }

  get databaseUrl(): string {
    return this.env.DATABASE_URL;
  }

  get testDatabaseUrl(): string {
    return this.env.TEST_DATABASE_URL;
  }

  get betterAuthStaffSecret(): string {
    return this.env.BETTER_AUTH_STAFF_SECRET;
  }

  get betterAuthCustomerSecret(): string {
    return this.env.BETTER_AUTH_CUSTOMER_SECRET;
  }

  get betterAuthUrl(): string {
    return this.env.BETTER_AUTH_URL;
  }

  get publicAppBaseUrl(): string {
    return this.env.PUBLIC_APP_BASE_URL;
  }

  get smtpHost(): string {
    return this.env.SMTP_HOST;
  }

  get smtpPort(): number {
    return this.env.SMTP_PORT;
  }

  get smtpSecure(): boolean {
    return this.env.SMTP_SECURE;
  }

  get smtpUser(): string {
    return this.env.SMTP_USER;
  }

  get smtpPassword(): string {
    return this.env.SMTP_PASSWORD;
  }

  get smtpFrom(): string {
    return this.env.SMTP_FROM;
  }

  get minioEndpoint(): string {
    return this.env.MINIO_ENDPOINT;
  }

  get minioRegion(): string {
    return this.env.MINIO_REGION;
  }

  get minioAccessKeyId(): string {
    return this.env.MINIO_ACCESS_KEY_ID;
  }

  get minioSecretAccessKey(): string {
    return this.env.MINIO_SECRET_ACCESS_KEY;
  }

  get minioBucket(): string {
    return this.env.MINIO_BUCKET;
  }

  get googleWalletIssuerId(): string | undefined {
    return this.env.GOOGLE_WALLET_ISSUER_ID;
  }

  get googleWalletServiceAccountEmail(): string | undefined {
    return this.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
  }

  get googleWalletPrivateKey(): string | undefined {
    return this.env.GOOGLE_WALLET_PRIVATE_KEY;
  }

  get appleWalletPassTypeId(): string | undefined {
    return this.env.APPLE_WALLET_PASS_TYPE_ID;
  }

  get appleWalletTeamId(): string | undefined {
    return this.env.APPLE_WALLET_TEAM_ID;
  }

  get appleWalletCertPem(): string | undefined {
    return this.env.APPLE_WALLET_CERT_PEM;
  }

  get appleWalletKeyPem(): string | undefined {
    return this.env.APPLE_WALLET_KEY_PEM;
  }

  get appleWalletWwdrPem(): string | undefined {
    return this.env.APPLE_WALLET_WWDR_PEM;
  }

  get appleWalletKeyPassphrase(): string | undefined {
    return this.env.APPLE_WALLET_KEY_PASSPHRASE;
  }

  get googleOAuthClientId(): string | undefined {
    return this.env.GOOGLE_OAUTH_CLIENT_ID;
  }

  get googleOAuthClientSecret(): string | undefined {
    return this.env.GOOGLE_OAUTH_CLIENT_SECRET;
  }

  get appleOAuthClientId(): string | undefined {
    return this.env.APPLE_OAUTH_CLIENT_ID;
  }

  get appleOAuthTeamId(): string | undefined {
    return this.env.APPLE_OAUTH_TEAM_ID;
  }

  get appleOAuthKeyId(): string | undefined {
    return this.env.APPLE_OAUTH_KEY_ID;
  }

  get appleOAuthPrivateKey(): string | undefined {
    return this.env.APPLE_OAUTH_PRIVATE_KEY;
  }

  get appleOAuthAppBundleIdentifier(): string | undefined {
    return this.env.APPLE_OAUTH_APP_BUNDLE_IDENTIFIER;
  }

  get legacyDatabaseUrl(): string | undefined {
    return this.env.LEGACY_DATABASE_URL;
  }

  get legacyMediaStagingBucket(): string | undefined {
    return this.env.LEGACY_MEDIA_STAGING_BUCKET;
  }

  get legacyCloudinaryCloudName(): string | undefined {
    return this.env.LEGACY_CLOUDINARY_CLOUD_NAME;
  }
}
