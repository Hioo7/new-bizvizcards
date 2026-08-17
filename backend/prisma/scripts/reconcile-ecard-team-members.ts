// Standalone script (dev tooling, not app runtime) — one-time cleanup for
// ECardTeamMember rows added before EcardsService started requiring a team
// member to have an e-card linked to the card's own organisation. Safe to
// re-run: rows that already satisfy the rule are left untouched, and a
// second run against already-cleaned data simply deletes nothing. Run via
// `npm run reconcile:ecard-team-members`.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function reconcileEcardTeamMembers(): Promise<{
  deleted: number;
  skipped: number;
}> {
  const teamMembers = await prisma.eCardTeamMember.findMany({
    select: {
      id: true,
      teamComponent: {
        select: {
          ecardComponent: { select: { ecard: { select: { organisationId: true } } } },
        },
      },
      organisationMember: {
        select: { customer: { select: { ecards: { select: { organisationId: true } } } } },
      },
    },
  });

  const idsToDelete: string[] = [];
  let skipped = 0;

  for (const row of teamMembers) {
    const targetOrganisationId =
      row.teamComponent.ecardComponent.ecard.organisationId;

    if (!targetOrganisationId) {
      // Card's org was unlinked after this member was added — a different
      // problem, out of scope for this cleanup; leave the row alone.
      skipped += 1;
      continue;
    }

    const hasLinkedEcard = row.organisationMember.customer.ecards.some(
      (ecard) => ecard.organisationId === targetOrganisationId,
    );

    if (!hasLinkedEcard) {
      idsToDelete.push(row.id);
    }
  }

  if (idsToDelete.length > 0) {
    await prisma.eCardTeamMember.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  }

  return { deleted: idsToDelete.length, skipped };
}

async function main() {
  const { deleted, skipped } = await reconcileEcardTeamMembers();
  console.log(
    `Reconciled ${deleted} ECardTeamMember row(s) with no linked e-card in their organisation (${skipped} skipped: card not linked to any organisation).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Reconciliation failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
