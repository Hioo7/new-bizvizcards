// CLI-only shadow config: gives `npx auth generate` a plain, DI-free
// betterAuth() instance to introspect. Never imported by src/ — direct
// process.env access here mirrors the existing prisma.config.ts precedent
// (build-time tooling, not app runtime, so the AppConfig-only rule doesn't apply).
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { createEmployeeAuth } from '../../src/common/auth/employee-auth.factory';
import type { OtpSender } from '../../src/common/auth/otp-sender/otp-sender.interface';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const noopOtpSender: OtpSender = {
  send: () => Promise.resolve(),
};

export const auth = createEmployeeAuth({
  secret: process.env.BETTER_AUTH_STAFF_SECRET!,
  baseUrl: process.env.BETTER_AUTH_URL!,
  prisma,
  otpSender: noopOtpSender,
});
