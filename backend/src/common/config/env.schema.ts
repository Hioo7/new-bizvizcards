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
});

export type Env = z.infer<typeof envSchema>;
