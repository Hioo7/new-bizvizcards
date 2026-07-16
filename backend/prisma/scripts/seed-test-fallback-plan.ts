// Standalone script (dev/CI tooling, not app runtime) — ensures a single,
// permissive fallback Plan fixture exists in TEST_DATABASE_URL before the
// test suite runs (wired as the "pretest" npm script). This mirrors how
// smart card templates are a permanent, never-deleted fixture across every
// spec file: unrelated modules' tests (ecards, smart cards, organisations,
// leads) create customers with no currentPlanId, and once plan enforcement
// is wired into those services, they need SOME fallback plan to resolve to
// or every one of those tests would start failing with "no fallback
// configured". Deliberately generous limits — this fixture exists to be a
// no-op for every test that isn't specifically about plans; the plans
// module's own tests exercise restrictive-limit behavior by assigning a
// distinct personal test plan, never by relying on this fixture's limits.
// Idempotent: no-ops once a fallback plan already exists in this database.
// Run via `npm run seed:test-fallback-plan` (also runs automatically as
// "pretest" before `npm test`).
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ECardComponentType,
  PlanBusinessModelType,
  PrismaClient,
} from '../../src/generated/prisma/client';

const GENEROUS_LIMIT = 1000;
const GENEROUS_GALLERY_SIZE_BYTES = 100 * 1024 * 1024;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }),
});

function permissiveEcardPolicyCreateData() {
  return {
    isAvailable: true,
    maxEcards: GENEROUS_LIMIT,
    exchangeContactAccess: true,
    componentAvailabilities: {
      create: Object.values(ECardComponentType).map((type) => ({
        type,
        isAvailable: true,
        ...(type === ECardComponentType.GALLERY && {
          galleryLimits: {
            create: {
              maxGalleries: GENEROUS_LIMIT,
              maxImagesPerGallery: GENEROUS_LIMIT,
              maxGallerySizeBytes: GENEROUS_GALLERY_SIZE_BYTES,
            },
          },
        }),
      })),
    },
  };
}

function permissiveSmartCardPolicyCreateData() {
  return {
    isAvailable: true,
    maxSmartCards: GENEROUS_LIMIT,
    exchangeContactAccess: true,
  };
}

async function main() {
  const existing = await prisma.plan.findFirst({
    where: { isFallbackPlan: true },
  });
  if (existing) {
    console.log(`Test fallback fixture already exists (${existing.id}).`);
    return;
  }

  const plan = await prisma.plan.create({
    data: {
      name: 'Test Fixture Fallback Plan',
      price: 0,
      businessModelType: PlanBusinessModelType.ONE_TIME,
      isFallbackPlan: true,
      policy: {
        create: {
          ecardPolicy: { create: permissiveEcardPolicyCreateData() },
          smartCardPolicy: { create: permissiveSmartCardPolicyCreateData() },
          organisationPolicy: {
            create: {
              isAvailable: true,
              maxOrgsCanJoin: GENEROUS_LIMIT,
              maxOrgsCanCreate: GENEROUS_LIMIT,
              orgEcardPolicy: { create: permissiveEcardPolicyCreateData() },
              orgSmartCardPolicy: {
                create: permissiveSmartCardPolicyCreateData(),
              },
            },
          },
          eventPolicy: {
            create: {
              isAvailable: true,
              maxEvents: GENEROUS_LIMIT,
              maxGuestsPerEvent: GENEROUS_LIMIT,
            },
          },
        },
      },
    },
  });

  console.log(`Seeded test fallback fixture "${plan.name}" (${plan.id}).`);
}

main()
  .catch((error: unknown) => {
    console.error('Seeding test fallback fixture failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
