import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  const validEnv = {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    TEST_DATABASE_URL: 'postgresql://user:pass@localhost:5432/db_test',
    BETTER_AUTH_STAFF_SECRET: 'a'.repeat(32),
    BETTER_AUTH_CUSTOMER_SECRET: 'b'.repeat(32),
    BETTER_AUTH_URL: 'http://localhost:3000',
    PUBLIC_APP_BASE_URL: 'http://localhost:5173',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'smtp-user',
    SMTP_PASSWORD: 'smtp-password',
    SMTP_FROM: 'no-reply@example.com',
    MINIO_ENDPOINT: 'http://localhost:9000',
    MINIO_ACCESS_KEY_ID: 'minio-access-key',
    MINIO_SECRET_ACCESS_KEY: 'minio-secret-key',
    MINIO_BUCKET: 'cards-app-media',
  };

  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('parses a valid environment and exposes typed getters', () => {
    process.env = { ...validEnv };

    const config = new AppConfigService();

    expect(config.nodeEnv).toBe('test');
    expect(config.port).toBe(3000);
    expect(config.databaseUrl).toBe(validEnv.DATABASE_URL);
    expect(config.testDatabaseUrl).toBe(validEnv.TEST_DATABASE_URL);
    expect(config.betterAuthStaffSecret).toBe(
      validEnv.BETTER_AUTH_STAFF_SECRET,
    );
    expect(config.betterAuthCustomerSecret).toBe(
      validEnv.BETTER_AUTH_CUSTOMER_SECRET,
    );
    expect(config.betterAuthUrl).toBe(validEnv.BETTER_AUTH_URL);
    expect(config.publicAppBaseUrl).toBe(validEnv.PUBLIC_APP_BASE_URL);
    expect(config.smtpHost).toBe(validEnv.SMTP_HOST);
    expect(config.smtpPort).toBe(587);
    expect(config.smtpSecure).toBe(false);
    expect(config.smtpUser).toBe(validEnv.SMTP_USER);
    expect(config.smtpPassword).toBe(validEnv.SMTP_PASSWORD);
    expect(config.smtpFrom).toBe(validEnv.SMTP_FROM);
    expect(config.minioEndpoint).toBe(validEnv.MINIO_ENDPOINT);
    expect(config.minioRegion).toBe('us-east-1');
    expect(config.minioAccessKeyId).toBe(validEnv.MINIO_ACCESS_KEY_ID);
    expect(config.minioSecretAccessKey).toBe(validEnv.MINIO_SECRET_ACCESS_KEY);
    expect(config.minioBucket).toBe(validEnv.MINIO_BUCKET);
  });

  it('boots with Google Wallet vars unset and exposes them as undefined', () => {
    process.env = { ...validEnv };

    const config = new AppConfigService();

    expect(config.googleWalletIssuerId).toBeUndefined();
    expect(config.googleWalletServiceAccountEmail).toBeUndefined();
    expect(config.googleWalletPrivateKey).toBeUndefined();
  });

  it('exposes Google Wallet vars when set', () => {
    process.env = {
      ...validEnv,
      GOOGLE_WALLET_ISSUER_ID: 'issuer-123',
      GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL:
        'wallet@example.iam.gserviceaccount.com',
      GOOGLE_WALLET_PRIVATE_KEY:
        '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
    };

    const config = new AppConfigService();

    expect(config.googleWalletIssuerId).toBe('issuer-123');
    expect(config.googleWalletServiceAccountEmail).toBe(
      'wallet@example.iam.gserviceaccount.com',
    );
    expect(config.googleWalletPrivateKey).toBe(
      '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
    );
  });

  it('boots with Apple Wallet vars unset and exposes them as undefined', () => {
    process.env = { ...validEnv };

    const config = new AppConfigService();

    expect(config.appleWalletPassTypeId).toBeUndefined();
    expect(config.appleWalletTeamId).toBeUndefined();
    expect(config.appleWalletCertPem).toBeUndefined();
    expect(config.appleWalletKeyPem).toBeUndefined();
    expect(config.appleWalletWwdrPem).toBeUndefined();
    expect(config.appleWalletKeyPassphrase).toBeUndefined();
  });

  it('exposes Apple Wallet vars when set', () => {
    process.env = {
      ...validEnv,
      APPLE_WALLET_PASS_TYPE_ID: 'pass.com.example.bizcard',
      APPLE_WALLET_TEAM_ID: 'ABCDE12345',
      APPLE_WALLET_CERT_PEM:
        '-----BEGIN CERTIFICATE-----\ncert\n-----END CERTIFICATE-----',
      APPLE_WALLET_KEY_PEM:
        '-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----',
      APPLE_WALLET_WWDR_PEM:
        '-----BEGIN CERTIFICATE-----\nwwdr\n-----END CERTIFICATE-----',
      APPLE_WALLET_KEY_PASSPHRASE: 'super-secret',
    };

    const config = new AppConfigService();

    expect(config.appleWalletPassTypeId).toBe('pass.com.example.bizcard');
    expect(config.appleWalletTeamId).toBe('ABCDE12345');
    expect(config.appleWalletCertPem).toBe(
      '-----BEGIN CERTIFICATE-----\ncert\n-----END CERTIFICATE-----',
    );
    expect(config.appleWalletKeyPem).toBe(
      '-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----',
    );
    expect(config.appleWalletWwdrPem).toBe(
      '-----BEGIN CERTIFICATE-----\nwwdr\n-----END CERTIFICATE-----',
    );
    expect(config.appleWalletKeyPassphrase).toBe('super-secret');
  });

  it('throws when a secret is shorter than 32 characters', () => {
    process.env = { ...validEnv, BETTER_AUTH_STAFF_SECRET: 'too-short' };

    expect(() => new AppConfigService()).toThrow();
  });

  it('throws when DATABASE_URL is missing', () => {
    const withoutDatabaseUrl: Partial<typeof validEnv> = { ...validEnv };
    delete withoutDatabaseUrl.DATABASE_URL;
    process.env = { ...withoutDatabaseUrl };

    expect(() => new AppConfigService()).toThrow();
  });
});
