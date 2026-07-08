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
}
