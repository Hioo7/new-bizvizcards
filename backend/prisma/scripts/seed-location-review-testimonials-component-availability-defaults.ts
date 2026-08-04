// Standalone script (dev tooling, not app runtime) — backfills LOCATION_TILE,
// REVIEW_LINK, and TESTIMONIALS EcardComponentAvailability rows onto every
// existing EcardPolicy (these component types are new: every policy created
// before they existed is missing these rows, and ecardPolicySchema's
// completeness refine requires exactly one row per ECardComponentType).
// Seeded as unavailable — same "new paid-tier feature defaults off"
// convention as ECARD_GATED_HERO_LAYOUTS/ECARD_GATED_THEMES/
// ECARD_GATED_ICON_SHAPES and seed-video-gallery-component-availability-defaults.
// Idempotent: only acts on EcardPolicy rows missing a given type's row
// already, so re-running this script never overwrites an admin's later edit.
// Run via `npm run seed:location-review-testimonials-component-availability-defaults`,
// once, after applying the migration that introduces these 3 component types.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ECardComponentType,
  PrismaClient,
} from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const NEW_COMPONENT_TYPES = [
  ECardComponentType.LOCATION_TILE,
  ECardComponentType.REVIEW_LINK,
  ECardComponentType.TESTIMONIALS,
] as const;

async function main() {
  let totalBackfilled = 0;

  for (const type of NEW_COMPONENT_TYPES) {
    const ecardPolicies = await prisma.ecardPolicy.findMany({
      where: { componentAvailabilities: { none: { type } } },
      select: { id: true },
    });

    if (ecardPolicies.length === 0) {
      console.log(
        `No EcardPolicy rows are missing a ${type} availability row; skipping.`,
      );
      continue;
    }

    for (const ecardPolicy of ecardPolicies) {
      await prisma.ecardComponentAvailability.create({
        data: { ecardPolicyId: ecardPolicy.id, type, isAvailable: false },
      });
    }

    console.log(
      `Backfilled ${type} availability for ${ecardPolicies.length} EcardPolicy row(s).`,
    );
    totalBackfilled += ecardPolicies.length;
  }

  console.log(`Done. ${totalBackfilled} availability row(s) created.`);
}

main()
  .catch((error: unknown) => {
    console.error(
      'Backfilling LOCATION_TILE/REVIEW_LINK/TESTIMONIALS component availability defaults failed:',
      error,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
