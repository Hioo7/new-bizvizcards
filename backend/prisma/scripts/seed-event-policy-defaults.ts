// Standalone script (dev tooling, not app runtime) — backfills an EventPolicy
// row for every existing PlanPolicy row that predates the EventPolicy model
// (added after PlanPolicy already had rows). Uses the same conservative
// fallback defaults as seed-fallback-plan.ts. Idempotent: only touches rows
// where PlanPolicy.eventPolicyId is still null.
// Run via `npm run seed:event-policy-defaults`, once, before applying the
// follow-up migration that sets PlanPolicy.eventPolicyId NOT NULL.
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
  // Raw query, not the typed Prisma Client `where` filter: the schema
  // declares eventPolicyId as required (its final desired state), so the
  // generated types don't allow filtering/comparing it against null even
  // though the column is still nullable in the DB at this point in the
  // migration sequence.
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

main()
  .catch((error: unknown) => {
    console.error('Backfilling event policy defaults failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
