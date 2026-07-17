// Dev-only script: seeds 4 dummy customers and adds them as members of the
// first organisation found in the database. Safe to re-run — upserts by email.
// Run via: npm run seed:dummy-members

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DUMMY_MEMBERS = [
  { name: 'Priya Sharma', email: 'priya.sharma@example.com', role: 'MEMBER' as const },
  { name: 'Rahul Verma', email: 'rahul.verma@example.com', role: 'MEMBER' as const },
  { name: 'Ananya Iyer', email: 'ananya.iyer@example.com', role: 'SPOC' as const },
  { name: 'Dev Patel', email: 'dev.patel@example.com', role: 'MEMBER' as const },
];

async function main() {
  // Find the first organisation
  const org = await prisma.organisation.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!org) {
    throw new Error(
      'No organisation found. Create an organisation through the app first, then re-run this script.',
    );
  }

  console.log(`Seeding dummy members into organisation: "${org.name}" (${org.id})`);

  for (const member of DUMMY_MEMBERS) {
    // Upsert CustomerAccount (Better Auth account, no password/credentials needed for UI testing)
    const account = await prisma.customerAccount.upsert({
      where: { email: member.email },
      update: { name: member.name },
      create: {
        name: member.name,
        email: member.email,
        emailVerified: true,
      },
    });

    // Upsert Customer linked to that account
    const customer = await prisma.customer.upsert({
      where: { accountId: account.id },
      update: {},
      create: { accountId: account.id },
    });

    // Upsert OrganisationMember
    await prisma.organisationMember.upsert({
      where: {
        customerId_organisationId: {
          customerId: customer.id,
          organisationId: org.id,
        },
      },
      update: { role: member.role, status: 'ACTIVE' },
      create: {
        customerId: customer.id,
        organisationId: org.id,
        role: member.role,
        status: 'ACTIVE',
      },
    });

    console.log(`  ✓ ${member.name} (${member.email}) — ${member.role}`);
  }

  console.log('\nDone. Refresh the Members tab to see the new entries.');
}

main()
  .catch((error: unknown) => {
    console.error('Seeding dummy members failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
