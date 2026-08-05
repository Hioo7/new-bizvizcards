// Standalone script (dev tooling, not app runtime) — backfills an
// EmailSignaturePolicy row for every existing PlanPolicy row that predates
// the EmailSignaturePolicy model (added after PlanPolicy already had rows).
// Uses the same conservative fallback defaults as seed-fallback-plan.ts.
// Idempotent: only touches rows where PlanPolicy.emailSignaturePolicyId is
// still null.
// Run via `npm run seed:email-signature-policy-defaults`, once, before
// applying the follow-up migration that sets
// PlanPolicy.emailSignaturePolicyId NOT NULL.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PLAN_FALLBACK_MAX_EMAIL_SIGNATURES } from '../../src/modules/plans/plans.constants';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  // Raw query, not the typed Prisma Client `where` filter: the schema
  // declares emailSignaturePolicyId as required (its final desired state),
  // so the generated types don't allow filtering/comparing it against null
  // even though the column is still nullable in the DB at this point in the
  // migration sequence.
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

main()
  .catch((error: unknown) => {
    console.error('Backfilling email signature policy defaults failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
