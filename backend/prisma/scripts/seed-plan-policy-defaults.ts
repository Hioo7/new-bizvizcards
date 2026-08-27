// Standalone script (also run automatically on every backend container
// startup — see the Dockerfile CMD — right after `prisma migrate deploy`
// and before the app starts serving) — idempotently backfills every
// currently-known default onto existing PlanPolicy/EcardPolicy rows that
// predate whatever feature introduced it. This is the single consolidated
// home for that whole class of backfill: the next time a new gated
// EcardPolicy component/theme/layout/preset or a new required PlanPolicy
// relation is added, its backfill belongs here as one more function called
// from main(), not as a new standalone script.
//
// Because this now runs on every container start (not just once by hand),
// every function here must stay strictly idempotent — only ever act on rows
// that are actually missing the default, never touch a row an admin has
// since edited.
//
// Run via `npm run seed:plan-policy-defaults`.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ECardComponentType,
  PrismaClient,
} from '../../src/generated/prisma/client';
import { DEFAULT_ECARD_ACCENT_COLOR_PRESETS } from '../../src/modules/ecards/ecards.constants';
import {
  PLAN_FALLBACK_MAX_EVENTS,
  PLAN_FALLBACK_MAX_GUESTS_PER_EVENT,
  PLAN_FALLBACK_MAX_EMAIL_SIGNATURES,
  PLAN_FALLBACK_MAX_VIDEO_GALLERIES,
  PLAN_FALLBACK_MAX_VIDEOS_PER_GALLERY,
} from '../../src/modules/plans/plans.constants';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Backfills an EventPolicy row for every existing PlanPolicy row that
// predates the EventPolicy model. Uses the same conservative fallback
// defaults as seed-fallback-plan.ts.
async function backfillEventPolicy(): Promise<void> {
  // Raw query, not the typed Prisma Client `where` filter: the schema
  // declares eventPolicyId as required (its final desired state), so the
  // generated types don't allow filtering/comparing it against null even
  // though the column could still be null on an older/restored database.
  const planPolicies = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "PlanPolicy" WHERE "eventPolicyId" IS NULL
  `;

  if (planPolicies.length === 0) {
    console.log('No PlanPolicy rows are missing an eventPolicyId; skipping.');
    return;
  }

  for (const planPolicy of planPolicies) {
    const eventPolicy = await prisma.eventPolicy.create({
      data: {
        isAvailable: true,
        maxEvents: PLAN_FALLBACK_MAX_EVENTS,
        maxGuestsPerEvent: PLAN_FALLBACK_MAX_GUESTS_PER_EVENT,
      },
    });
    await prisma.planPolicy.update({
      where: { id: planPolicy.id },
      data: { eventPolicyId: eventPolicy.id },
    });
  }

  console.log(
    `Backfilled eventPolicyId for ${planPolicies.length} PlanPolicy row(s).`,
  );
}

// Backfills an EmailSignaturePolicy row for every existing PlanPolicy row
// that predates the EmailSignaturePolicy model.
async function backfillEmailSignaturePolicy(): Promise<void> {
  const planPolicies = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "PlanPolicy" WHERE "emailSignaturePolicyId" IS NULL
  `;

  if (planPolicies.length === 0) {
    console.log(
      'No PlanPolicy rows are missing an emailSignaturePolicyId; skipping.',
    );
    return;
  }

  for (const planPolicy of planPolicies) {
    const emailSignaturePolicy = await prisma.emailSignaturePolicy.create({
      data: {
        isAvailable: true,
        maxEmailSignatures: PLAN_FALLBACK_MAX_EMAIL_SIGNATURES,
      },
    });
    await prisma.planPolicy.update({
      where: { id: planPolicy.id },
      data: { emailSignaturePolicyId: emailSignaturePolicy.id },
    });
  }

  console.log(
    `Backfilled emailSignaturePolicyId for ${planPolicies.length} PlanPolicy row(s).`,
  );
}

// Backfills the default accent-color presets onto every existing
// EcardPolicy row that has zero presets — this feature is a retrofit, every
// plan predating it has none. Only acts on policies with zero presets
// already, so it never duplicates presets onto a policy an admin has since
// edited.
async function backfillAccentColorPresets(): Promise<void> {
  const ecardPolicies = await prisma.ecardPolicy.findMany({
    where: { accentColorPresets: { none: {} } },
    select: { id: true },
  });

  if (ecardPolicies.length === 0) {
    console.log(
      'No EcardPolicy rows are missing accent-color presets; skipping.',
    );
    return;
  }

  for (const ecardPolicy of ecardPolicies) {
    await prisma.ecardAccentColorPreset.createMany({
      data: DEFAULT_ECARD_ACCENT_COLOR_PRESETS.map((preset, order) => ({
        ecardPolicyId: ecardPolicy.id,
        themeAffinity: preset.themeAffinity,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        order,
      })),
    });
  }

  console.log(
    `Backfilled default accent-color presets for ${ecardPolicies.length} EcardPolicy row(s).`,
  );
}

// Backfills a VIDEO_GALLERY EcardComponentAvailability row onto every
// existing EcardPolicy missing one (this component type is new; every
// policy created before it existed is missing this row, and
// ecardPolicySchema's completeness refine requires exactly one row per
// ECardComponentType). Seeded as unavailable — same "new paid-tier feature
// defaults off" convention as every other gated component/theme/layout.
async function backfillVideoGalleryAvailability(): Promise<void> {
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

// Backfills LOCATION_TILE, REVIEW_LINK, and TESTIMONIALS
// EcardComponentAvailability rows onto every existing EcardPolicy missing
// them — same retrofit reasoning as backfillVideoGalleryAvailability above.
async function backfillLocationReviewTestimonialsAvailability(): Promise<void> {
  const NEW_COMPONENT_TYPES = [
    ECardComponentType.LOCATION_TILE,
    ECardComponentType.REVIEW_LINK,
    ECardComponentType.TESTIMONIALS,
  ] as const;

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

  console.log(
    `Location/review/testimonials backfill done. ${totalBackfilled} availability row(s) created.`,
  );
}

// Backfills an ABOUT_US EcardComponentAvailability row onto every existing
// EcardPolicy missing one — same retrofit reasoning as the functions above.
// Seeded as available — ABOUT_US is a basic feature available to all plans.
async function backfillAboutUsAvailability(): Promise<void> {
  const ecardPolicies = await prisma.ecardPolicy.findMany({
    where: {
      componentAvailabilities: {
        none: { type: ECardComponentType.ABOUT_US },
      },
    },
    select: { id: true },
  });

  if (ecardPolicies.length === 0) {
    console.log(
      'No EcardPolicy rows are missing an ABOUT_US availability row; skipping.',
    );
    return;
  }

  for (const ecardPolicy of ecardPolicies) {
    await prisma.ecardComponentAvailability.create({
      data: {
        ecardPolicyId: ecardPolicy.id,
        type: ECardComponentType.ABOUT_US,
        isAvailable: true,
      },
    });
  }

  console.log(
    `Backfilled ABOUT_US availability for ${ecardPolicies.length} EcardPolicy row(s).`,
  );
}

async function main() {
  await backfillEventPolicy();
  await backfillEmailSignaturePolicy();
  await backfillAccentColorPresets();
  await backfillVideoGalleryAvailability();
  await backfillLocationReviewTestimonialsAvailability();
  await backfillAboutUsAvailability();
}

main()
  .catch((error: unknown) => {
    console.error('Seeding plan policy defaults failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
