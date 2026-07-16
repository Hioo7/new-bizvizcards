// Standalone script (dev tooling, not app runtime) — seeds the single
// system-wide fallback plan if none exists yet. The fallback plan is what
// PlanPolicyResolverService resolves to for any customer with no active
// plan (or an expired one) — see PLAN_FALLBACK_PLAN_MISSING_MESSAGE, which
// is thrown loudly if this has never been run. Safe to re-run: no-ops once
// a fallback plan exists (use the admin UI's "set as fallback" action to
// change which plan is the fallback afterwards, not this script).
// Run via `npm run seed:fallback-plan`.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ECardComponentType,
  PlanBusinessModelType,
  PrismaClient,
} from '../../src/generated/prisma/client';
import {
  PLAN_FALLBACK_MAX_ECARDS,
  PLAN_FALLBACK_MAX_EVENTS,
  PLAN_FALLBACK_MAX_GALLERIES,
  PLAN_FALLBACK_MAX_GALLERY_SIZE_BYTES,
  PLAN_FALLBACK_MAX_GUESTS_PER_EVENT,
  PLAN_FALLBACK_MAX_IMAGES_PER_GALLERY,
  PLAN_FALLBACK_MAX_ORGS_CAN_CREATE,
  PLAN_FALLBACK_MAX_ORGS_CAN_JOIN,
  PLAN_FALLBACK_MAX_SMART_CARDS,
  PLAN_FALLBACK_NAME,
} from '../../src/modules/plans/plans.constants';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

function ecardPolicyCreateData(maxEcards: number) {
  return {
    isAvailable: true,
    maxEcards,
    exchangeContactAccess: false,
    componentAvailabilities: {
      create: Object.values(ECardComponentType).map((type) => ({
        type,
        isAvailable: true,
        ...(type === ECardComponentType.GALLERY && {
          galleryLimits: {
            create: {
              maxGalleries: PLAN_FALLBACK_MAX_GALLERIES,
              maxImagesPerGallery: PLAN_FALLBACK_MAX_IMAGES_PER_GALLERY,
              maxGallerySizeBytes: PLAN_FALLBACK_MAX_GALLERY_SIZE_BYTES,
            },
          },
        }),
      })),
    },
  };
}

function smartCardPolicyCreateData(maxSmartCards: number) {
  return {
    isAvailable: true,
    maxSmartCards,
    exchangeContactAccess: false,
  };
}

async function main() {
  const existing = await prisma.plan.findFirst({
    where: { isFallbackPlan: true },
  });
  if (existing) {
    console.log(`Fallback plan already exists (${existing.id}); skipping.`);
    return;
  }

  const plan = await prisma.plan.create({
    data: {
      name: PLAN_FALLBACK_NAME,
      price: 0,
      businessModelType: PlanBusinessModelType.ONE_TIME,
      isFallbackPlan: true,
      policy: {
        create: {
          ecardPolicy: {
            create: ecardPolicyCreateData(PLAN_FALLBACK_MAX_ECARDS),
          },
          smartCardPolicy: {
            create: smartCardPolicyCreateData(PLAN_FALLBACK_MAX_SMART_CARDS),
          },
          organisationPolicy: {
            create: {
              isAvailable: true,
              maxOrgsCanJoin: PLAN_FALLBACK_MAX_ORGS_CAN_JOIN,
              maxOrgsCanCreate: PLAN_FALLBACK_MAX_ORGS_CAN_CREATE,
              orgEcardPolicy: { create: ecardPolicyCreateData(0) },
              orgSmartCardPolicy: { create: smartCardPolicyCreateData(0) },
            },
          },
          eventPolicy: {
            create: {
              isAvailable: true,
              maxEvents: PLAN_FALLBACK_MAX_EVENTS,
              maxGuestsPerEvent: PLAN_FALLBACK_MAX_GUESTS_PER_EVENT,
            },
          },
        },
      },
    },
  });

  console.log(`Seeded fallback plan "${plan.name}" (${plan.id}).`);
}

main()
  .catch((error: unknown) => {
    console.error('Seeding fallback plan failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
