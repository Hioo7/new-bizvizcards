import path from 'node:path';
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Config for the read-only legacy-DB mirror schema (prisma/legacy-schema).
// No `migrations` path — this database already exists and is never migrated
// from here, only introspected/queried by the data migration pipeline.
export default defineConfig({
  schema: path.join(__dirname, 'legacy-schema'),
  datasource: {
    url: env('LEGACY_DATABASE_URL'),
  },
});
