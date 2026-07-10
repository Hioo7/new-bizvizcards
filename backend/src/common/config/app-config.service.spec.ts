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
