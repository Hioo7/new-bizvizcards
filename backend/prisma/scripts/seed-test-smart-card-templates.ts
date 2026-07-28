// Standalone script (dev/CI tooling, not app runtime) — ensures the fixed
// set of smart card templates exists in TEST_DATABASE_URL before the test
// suite runs (wired as the "pretest" npm script, alongside
// seed-test-fallback-plan.ts). Every spec that resolves a whitelisted
// template by key (e.g. PlanEnforcementService's
// assertSmartCardTemplateAllowed tests) needs these rows to exist —
// otherwise `findUniqueOrThrow` fails on a fresh database, exactly as it
// would in CI before this script existed.
// Idempotent: upserts by key, matching seed-smart-card-templates.ts (the
// TEST_DATABASE_URL twin of that DATABASE_URL-facing script).
// Run via `npm run seed:test-smart-card-templates` (also runs automatically
// as "pretest" before `npm test`).
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  SmartCardTemplateKey,
} from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }),
});

const TEMPLATES: { key: SmartCardTemplateKey; name: string }[] = [
  {
    key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
    name: 'Interior Design Template',
  },
  {
    key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_2,
    name: 'Interior Design Template 2',
  },
  {
    key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_3,
    name: 'Interior Design Template 3',
  },
];

async function main() {
  for (const { key, name } of TEMPLATES) {
    await prisma.smartCardTemplate.upsert({
      where: { key },
      update: { name },
      create: { key, name },
    });
  }

  console.log(`Seeded ${TEMPLATES.length} smart card templates.`);
}

main()
  .catch((error: unknown) => {
    console.error('Seeding smart card templates failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
