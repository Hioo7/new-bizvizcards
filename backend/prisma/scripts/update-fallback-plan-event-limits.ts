// Standalone script (dev tooling) — updates the fallback plan's EventPolicy
// limits to match the current PLAN_FALLBACK_MAX_EVENTS and
// PLAN_FALLBACK_MAX_GUESTS_PER_EVENT constants. Run this after changing those
// constants if the fallback plan already exists in the database.
// Run via `npx tsx prisma/scripts/update-fallback-plan-event-limits.ts`
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import {
  PLAN_FALLBACK_MAX_EVENTS,
  PLAN_FALLBACK_MAX_GUESTS_PER_EVENT,
} from '../../src/modules/plans/plans.constants';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const fallback = await prisma.plan.findFirst({
    where: { isFallbackPlan: true },
    include: { policy: { include: { eventPolicy: true } } },
  });

  if (!fallback) {
    console.error('No fallback plan found. Run seed:fallback-plan first.');
    process.exitCode = 1;
    return;
  }

  const eventPolicy = fallback.policy?.eventPolicy;
  if (!eventPolicy) {
    console.error('Fallback plan has no eventPolicy. Run seed:event-policy-defaults first.');
    process.exitCode = 1;
    return;
  }

  await prisma.eventPolicy.update({
    where: { id: eventPolicy.id },
    data: {
      isAvailable: true,
      maxEvents: PLAN_FALLBACK_MAX_EVENTS,
      maxGuestsPerEvent: PLAN_FALLBACK_MAX_GUESTS_PER_EVENT,
    },
  });

  console.log(
    `Updated fallback plan event policy: maxEvents=${PLAN_FALLBACK_MAX_EVENTS}, maxGuestsPerEvent=${PLAN_FALLBACK_MAX_GUESTS_PER_EVENT}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Update failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
