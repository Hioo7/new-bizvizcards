// Standalone script (dev tooling, not app runtime) — backfills a
// VIDEO_GALLERY EcardComponentAvailability row onto every existing
// EcardPolicy (this component type is new: every policy created before it
// existed is missing this row, and ecardPolicySchema's completeness refine
// requires exactly one row per ECardComponentType). Seeded as unavailable —
// same "new paid-tier feature defaults off" convention as
// ECARD_GATED_HERO_LAYOUTS/ECARD_GATED_THEMES/ECARD_GATED_ICON_SHAPES —
// so no existing plan gains Video Gallery access automatically. Idempotent:
// only acts on EcardPolicy rows missing a VIDEO_GALLERY row already, so
// re-running this script never overwrites an admin's later edit.
// Run via `npm run seed:video-gallery-component-availability-defaults`, once,
// after applying the migration that introduces VIDEO_GALLERY.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ECardComponentType,
  PrismaClient,
} from '../../src/generated/prisma/client';
import {
  PLAN_FALLBACK_MAX_VIDEO_GALLERIES,
  PLAN_FALLBACK_MAX_VIDEOS_PER_GALLERY,
} from '../../src/modules/plans/plans.constants';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const ecardPolicies = await prisma.ecardPolicy.findMany({
    where: {
      componentAvailabilities: {
        none: { type: ECardComponentType.VIDEO_GALLERY },
      },
    },
    select: { id: true },
  });

  if (ecardPolicies.length === 0) {
    console.log(
      'No EcardPolicy rows are missing a VIDEO_GALLERY availability row; skipping.',
    );
    return;
  }

  for (const ecardPolicy of ecardPolicies) {
    await prisma.ecardComponentAvailability.create({
      data: {
        ecardPolicyId: ecardPolicy.id,
        type: ECardComponentType.VIDEO_GALLERY,
        isAvailable: false,
        videoGalleryLimits: {
          create: {
            maxVideoGalleries: PLAN_FALLBACK_MAX_VIDEO_GALLERIES,
            maxVideosPerGallery: PLAN_FALLBACK_MAX_VIDEOS_PER_GALLERY,
          },
        },
      },
    });
  }

  console.log(
    `Backfilled VIDEO_GALLERY availability for ${ecardPolicies.length} EcardPolicy row(s).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      'Backfilling VIDEO_GALLERY component availability defaults failed:',
      error,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
