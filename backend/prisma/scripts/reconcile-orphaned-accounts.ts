// Standalone script (dev tooling, not app runtime) — safety net for the rare
// case where databaseHooks.user.create.after in employee-auth.factory.ts /
// customer-auth.factory.ts exhausts its retries and leaves a CustomerAccount/
// EmployeeAccount row with no linked Customer/Employee row. Safe to re-run:
// the upserts are idempotent. Run via `npm run reconcile:auth-accounts`.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function reconcileCustomers(): Promise<number> {
  const orphaned = await prisma.customerAccount.findMany({
    where: { customer: null },
    select: { id: true },
  });

  for (const account of orphaned) {
    await prisma.customer.upsert({
      where: { accountId: account.id },
      create: { accountId: account.id },
      update: {},
    });
  }

  return orphaned.length;
}

async function reconcileEmployees(): Promise<number> {
  const orphaned = await prisma.employeeAccount.findMany({
    where: { employee: null },
    select: { id: true },
  });

  for (const account of orphaned) {
    await prisma.employee.upsert({
      where: { accountId: account.id },
      create: { accountId: account.id },
      update: {},
    });
  }

  return orphaned.length;
}

async function main() {
  const [customersLinked, employeesLinked] = await Promise.all([
    reconcileCustomers(),
    reconcileEmployees(),
  ]);

  console.log(
    `Reconciled ${customersLinked} orphaned CustomerAccount row(s) and ${employeesLinked} orphaned EmployeeAccount row(s).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Reconciliation failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
