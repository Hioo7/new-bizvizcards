// Standalone script (dev tooling, not app runtime) — seeds the fixed set of
// smart card templates. Templates are developer-maintained (a new template
// means adding a SmartCardTemplateKey enum member + running this script), never
// created/updated/deleted through any API. Safe to re-run: upserts by key.
// Run via `npm run seed:smart-card-templates`.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  SmartCardTemplateKey,
} from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const TEMPLATES: { key: SmartCardTemplateKey; name: string }[] = [
  { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE, name: 'Interior Design Template' },
  { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_2, name: 'Interior Design Template 2' },
  { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_3, name: 'Interior Design Template 3' },
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
