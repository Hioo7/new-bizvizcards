// Standalone script (dev tooling, not app runtime) — bootstraps the very
// first super_admin EmployeeAccount. better-auth's admin plugin requires an
// existing admin to create the next one via /admin/create-user, so the first
// one has to be inserted directly. Safe to re-run: upserts by email. Sign-in
// afterwards is a normal OTP flow against SUPER_ADMIN_EMAIL — no password to
// seed (EmployeeCredential stays empty under admin()+emailOTP() alone). Run
// via `npm run seed:super-admin`.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { EMPLOYEE_ROLE } from '../../src/common/constants/roles.constants';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const raw = process.env.SUPER_ADMIN_EMAILS ?? process.env.SUPER_ADMIN_EMAIL;
  if (!raw) {
    throw new Error('SUPER_ADMIN_EMAILS must be set to seed super_admin accounts.');
  }

  const emails = raw.split(',').map((e) => e.trim()).filter(Boolean);

  for (const email of emails) {
    const account = await prisma.employeeAccount.upsert({
      where: { email },
      update: { role: EMPLOYEE_ROLE.SUPER_ADMIN },
      create: {
        email,
        name: 'Super Admin',
        emailVerified: true,
        role: EMPLOYEE_ROLE.SUPER_ADMIN,
      },
    });

    await prisma.employee.upsert({
      where: { accountId: account.id },
      create: { accountId: account.id },
      update: {},
    });

    console.log(`Seeded super_admin EmployeeAccount for ${email}.`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Seeding super_admin failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
