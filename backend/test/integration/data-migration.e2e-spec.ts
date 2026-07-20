import { randomUUID } from 'crypto';
import express from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { LegacyPrismaService } from '../../src/common/legacy-db/legacy-prisma.service';
import {
  EMPLOYEE_AUTH,
  EMPLOYEE_AUTH_BASE_PATH,
} from '../../src/common/auth/auth.constants';
import type { EmployeeAuth } from '../../src/common/auth/employee-auth.factory';
import { NodemailerOtpSender } from '../../src/common/auth/otp-sender/nodemailer-otp-sender.service';
import { EMPLOYEE_ROLE } from '../../src/common/constants/roles.constants';
import { BetterAuthApiErrorFilter } from '../../src/common/filters/better-auth-api-error.filter';
import {
  SmartCardTemplateKey,
  MigrationJobStatus,
} from '../../src/generated/prisma/client';
import { MigrationOrchestratorService } from '../../src/modules/migration/services/migration-orchestrator.service';
import { MigrationPreflightService } from '../../src/modules/migration/services/migration-preflight.service';

class FakeOtpSender {
  private lastOtpByEmail = new Map<string, string>();

  send({ email, otp }: { email: string; otp: string }): Promise<void> {
    this.lastOtpByEmail.set(email, otp);
    return Promise.resolve();
  }

  otpFor(email: string): string {
    const otp = this.lastOtpByEmail.get(email);
    if (!otp) throw new Error(`No OTP captured for ${email}`);
    return otp;
  }
}

// Preflight's real checks are infra-heavy (SSH tunnel, staging bucket) and
// are already covered by migration-preflight.service.spec.ts — stubbed out
// here so this spec can focus purely on pipeline correctness against real
// TEST_DATABASE_URL / LEGACY_TEST_DATABASE_URL data.
const STUBBED_PREFLIGHT: Pick<MigrationPreflightService, 'runAll'> = {
  runAll: () => Promise.resolve({ checks: [], canStart: true }),
};

describe('Data migration pipeline (e2e, TEST_DATABASE_URL + LEGACY_TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let legacyPrisma: LegacyPrismaService;
  let orchestrator: MigrationOrchestratorService;
  let employeeAuth: EmployeeAuth;
  let fakeOtpSender: FakeOtpSender;
  let originalDatabaseUrl: string | undefined;
  let originalLegacyDatabaseUrl: string | undefined;
  let superAdminAccountId: string;

  // Every row this spec creates, tracked for teardown — both new-schema
  // (deleted in afterAll, dependency order: MigrationRecord/Job first since
  // MigrationJob.triggeredByEmployeeId is onDelete: Restrict, then
  // leaf-to-root for everything else) and legacy fixtures.
  const seededJobIds: string[] = [];
  const seededCustomerAccountEmails: string[] = [];
  const seededEmployeeAccountEmails: string[] = [];
  const seededOrganisationNames: string[] = [];
  const seededSmartCardEndpoints: string[] = [];
  const seededLegacyUserIds: string[] = [];
  const seededLegacyCardUserIds: string[] = [];
  const seededLegacyOrganisationIds: string[] = [];
  const seededLegacySmartCardTemplateIds: string[] = [];
  const seededLegacyLeadFolderIds: string[] = [];
  const seededLegacyRestrictedRouteIds: string[] = [];
  const seededLegacyRedirectRouteIds: string[] = [];
  const seededLegacyExternalRedirectRouteIds: string[] = [];
  const seededRestrictedPaths: string[] = [];
  const seededInternalRedirectSourcePaths: string[] = [];
  const seededExternalRedirectSourcePaths: string[] = [];

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    originalLegacyDatabaseUrl = process.env.LEGACY_DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.LEGACY_DATABASE_URL = process.env.LEGACY_TEST_DATABASE_URL;

    fakeOtpSender = new FakeOtpSender();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NodemailerOtpSender)
      .useValue(fakeOtpSender)
      .overrideProvider(MigrationPreflightService)
      .useValue(STUBBED_PREFLIGHT)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });

    employeeAuth = app.get<EmployeeAuth>(EMPLOYEE_AUTH);
    const httpAdapter = app.getHttpAdapter().getInstance();
    httpAdapter.all(
      `${EMPLOYEE_AUTH_BASE_PATH}/*splat`,
      toNodeHandler(employeeAuth),
    );
    app.use(express.json());
    app.useGlobalFilters(new BetterAuthApiErrorFilter());

    await app.init();

    prisma = app.get(PrismaService);
    legacyPrisma = app.get(LegacyPrismaService);
    orchestrator = app.get(MigrationOrchestratorService);

    for (const key of Object.values(SmartCardTemplateKey)) {
      await prisma.smartCardTemplate.upsert({
        where: { key },
        update: {},
        create: { key, name: key },
      });
    }

    const superAdminEmail = `migration-e2e-runner-${randomUUID()}@example.com`;
    const superAdminAccount = await prisma.employeeAccount.create({
      data: {
        name: 'Migration Runner',
        email: superAdminEmail,
        emailVerified: true,
        role: EMPLOYEE_ROLE.SUPER_ADMIN,
      },
    });
    superAdminAccountId = superAdminAccount.id;
    seededEmployeeAccountEmails.push(superAdminEmail);
    await prisma.employee.create({ data: { accountId: superAdminAccount.id } });
  });

  afterAll(async () => {
    // MigrationJob.triggeredByEmployeeId is onDelete: Restrict — records and
    // jobs must go before any EmployeeAccount they reference.
    if (seededJobIds.length > 0) {
      await prisma.migrationRecord.deleteMany({
        where: { lastProcessedJobId: { in: seededJobIds } },
      });
      await prisma.migrationJob.deleteMany({
        where: { id: { in: seededJobIds } },
      });
    }
    // RESTRICTED_ROUTE / INTERNAL_REDIRECT / EXTERNAL_REDIRECT — standalone,
    // no FK to anything else, so order relative to the rest doesn't matter.
    if (seededRestrictedPaths.length > 0) {
      await prisma.restrictedRedirectPath.deleteMany({
        where: { path: { in: seededRestrictedPaths } },
      });
    }
    if (seededInternalRedirectSourcePaths.length > 0) {
      await prisma.internalRedirectRoute.deleteMany({
        where: { sourcePath: { in: seededInternalRedirectSourcePaths } },
      });
    }
    if (seededExternalRedirectSourcePaths.length > 0) {
      await prisma.externalRedirectRoute.deleteMany({
        where: { sourcePath: { in: seededExternalRedirectSourcePaths } },
      });
    }
    if (seededSmartCardEndpoints.length > 0) {
      // SmartCard.customerId is onDelete: SetNull — deleted explicitly
      // rather than relying on the CustomerAccount cascade below.
      await prisma.smartCard.deleteMany({
        where: { endpoint: { in: seededSmartCardEndpoints } },
      });
    }
    if (seededOrganisationNames.length > 0) {
      // Organisation.createdByCustomerId is onDelete: SetNull — same
      // reasoning as SmartCard above.
      await prisma.organisation.deleteMany({
        where: { name: { in: seededOrganisationNames } },
      });
    }
    if (seededCustomerAccountEmails.length > 0) {
      // Cascades: Customer, CustomerCredential, ECard(+components),
      // LeadFolder, Lead, remaining OrganisationMember rows.
      await prisma.customerAccount.deleteMany({
        where: { email: { in: seededCustomerAccountEmails } },
      });
    }
    if (seededEmployeeAccountEmails.length > 0) {
      // Cascades: Employee.
      await prisma.employeeAccount.deleteMany({
        where: { email: { in: seededEmployeeAccountEmails } },
      });
    }

    if (seededLegacyLeadFolderIds.length > 0) {
      await legacyPrisma.legacyCardUserLead.deleteMany({
        where: { folderId: { in: seededLegacyLeadFolderIds } },
      });
      await legacyPrisma.legacyLeadFolder.deleteMany({
        where: { id: { in: seededLegacyLeadFolderIds } },
      });
    }
    if (seededLegacyCardUserIds.length > 0) {
      await legacyPrisma.legacyECard.deleteMany({
        where: { cardUserId: { in: seededLegacyCardUserIds } },
      });
      const legacySmartCards = await legacyPrisma.legacySmartCard.findMany({
        where: { cardUserId: { in: seededLegacyCardUserIds } },
        select: { id: true },
      });
      const legacySmartCardIds = legacySmartCards.map((card) => card.id);
      if (legacySmartCardIds.length > 0) {
        await legacyPrisma.legacySmartCardProfile.deleteMany({
          where: { smartCardId: { in: legacySmartCardIds } },
        });
      }
      await legacyPrisma.legacySmartCard.deleteMany({
        where: { cardUserId: { in: seededLegacyCardUserIds } },
      });
      await legacyPrisma.legacyOrganisationMember.deleteMany({
        where: { cardUserId: { in: seededLegacyCardUserIds } },
      });
      await legacyPrisma.legacyCardUserPermission.deleteMany({
        where: { cardUserId: { in: seededLegacyCardUserIds } },
      });
      await legacyPrisma.legacyCardUser.deleteMany({
        where: { id: { in: seededLegacyCardUserIds } },
      });
    }
    if (seededLegacySmartCardTemplateIds.length > 0) {
      await legacyPrisma.legacySmartCardTemplate.deleteMany({
        where: { id: { in: seededLegacySmartCardTemplateIds } },
      });
    }
    if (seededLegacyOrganisationIds.length > 0) {
      await legacyPrisma.legacyOrganisation.deleteMany({
        where: { id: { in: seededLegacyOrganisationIds } },
      });
    }
    if (seededLegacyUserIds.length > 0) {
      await legacyPrisma.legacyUser.deleteMany({
        where: { id: { in: seededLegacyUserIds } },
      });
    }
    if (seededLegacyRestrictedRouteIds.length > 0) {
      await legacyPrisma.legacyRestrictedRoute.deleteMany({
        where: { id: { in: seededLegacyRestrictedRouteIds } },
      });
    }
    if (seededLegacyRedirectRouteIds.length > 0) {
      await legacyPrisma.legacyRedirectRoute.deleteMany({
        where: { id: { in: seededLegacyRedirectRouteIds } },
      });
    }
    if (seededLegacyExternalRedirectRouteIds.length > 0) {
      await legacyPrisma.legacyExternalRedirectRoute.deleteMany({
        where: { id: { in: seededLegacyExternalRedirectRouteIds } },
      });
    }

    await app.close();
    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.LEGACY_DATABASE_URL = originalLegacyDatabaseUrl;
  });

  async function waitForJobCompletion(jobId: string) {
    seededJobIds.push(jobId);
    const deadline = Date.now() + 15_000;
    for (;;) {
      const job = await prisma.migrationJob.findUniqueOrThrow({
        where: { id: jobId },
      });
      if (
        job.status === MigrationJobStatus.COMPLETED ||
        job.status === MigrationJobStatus.FAILED
      ) {
        return job;
      }
      if (Date.now() > deadline) {
        throw new Error(`Migration job ${jobId} did not complete in time`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  describe('full pipeline happy path across interlinked fixtures', () => {
    const marker = randomUUID().slice(0, 8);
    const staffEmail = `legacy-staff-${marker}@example.com`;
    const ownerEmail = `legacy-owner-${marker}@example.com`;
    const memberEmail = `legacy-member-${marker}@example.com`;
    const legacyBcryptHash =
      '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqR9G8v2XZ8h5X0y0y0y0y0y0y0y0y';

    beforeAll(async () => {
      // STAFF_IDENTITY
      const legacyStaff = await legacyPrisma.legacyUser.create({
        data: {
          id: randomUUID(),
          name: 'Legacy Admin',
          email: staffEmail,
          passwordHash: 'unused',
          role: 'ADMIN',
        },
      });
      seededLegacyUserIds.push(legacyStaff.id);
      seededEmployeeAccountEmails.push(staffEmail);

      // CUSTOMER_IDENTITY — owner (password-based) + member (google-linked)
      const owner = await legacyPrisma.legacyCardUser.create({
        data: {
          id: randomUUID(),
          name: 'Card Owner',
          email: ownerEmail,
          password: legacyBcryptHash,
        },
      });
      seededLegacyCardUserIds.push(owner.id);
      seededCustomerAccountEmails.push(ownerEmail);
      await legacyPrisma.legacyCardUserPermission.create({
        data: {
          id: randomUUID(),
          cardUserId: owner.id,
          isExchangeContactEnabled: true,
        },
      });

      const member = await legacyPrisma.legacyCardUser.create({
        data: {
          id: randomUUID(),
          name: 'Org Member',
          email: memberEmail,
          googleId: `google-sub-${marker}`,
        },
      });
      seededLegacyCardUserIds.push(member.id);
      seededCustomerAccountEmails.push(memberEmail);

      // ORGANISATION + ORGANISATION_MEMBER (owner is sole SPOC)
      const org = await legacyPrisma.legacyOrganisation.create({
        data: {
          id: randomUUID(),
          displayName: `Acme ${marker}`,
          domainName: `acme-${marker}.com`,
        },
      });
      seededLegacyOrganisationIds.push(org.id);
      seededOrganisationNames.push(`Acme ${marker}`);
      await legacyPrisma.legacyOrganisationMember.create({
        data: {
          id: randomUUID(),
          cardUserId: owner.id,
          organisationId: org.id,
          role: 'SPOC',
        },
      });
      await legacyPrisma.legacyOrganisationMember.create({
        data: {
          id: randomUUID(),
          cardUserId: member.id,
          organisationId: org.id,
          role: 'MEMBER',
        },
      });

      // SMART_CARD
      const template = await legacyPrisma.legacySmartCardTemplate.create({
        data: {
          id: randomUUID(),
          slug: 'interior.design.template',
          name: 'Interior Design',
        },
      });
      seededLegacySmartCardTemplateIds.push(template.id);
      const smartCard = await legacyPrisma.legacySmartCard.create({
        data: {
          id: randomUUID(),
          cardUserId: owner.id,
          templateId: template.id,
          endpoint: `smart-${marker}`,
        },
      });
      seededSmartCardEndpoints.push(`smart-${marker}`);
      await legacyPrisma.legacySmartCardProfile.create({
        data: {
          smartCardId: smartCard.id,
          companyName: 'Acme Interiors',
          tagline: 'We design spaces',
        },
      });

      // ECARD
      await legacyPrisma.legacyECard.create({
        data: {
          id: randomUUID(),
          cardUserId: owner.id,
          endpoint: `ecard-${marker}`,
          Profession: 'Founder',
          whatsapp: '+91 98765 43210',
          instagram: 'acme_official',
          mob_country_code: 91,
          mobile_number: BigInt('9876543210'),
        },
      });

      // LEAD_FOLDER + LEAD, with owner's defaultLeadFolderId pointing at it
      const folder = await legacyPrisma.legacyLeadFolder.create({
        data: { id: randomUUID(), name: 'Trade Show', cardUserId: owner.id },
      });
      seededLegacyLeadFolderIds.push(folder.id);
      await legacyPrisma.legacyCardUser.update({
        where: { id: owner.id },
        data: { defaultLeadFolderId: folder.id },
      });
      await legacyPrisma.legacyCardUserLead.create({
        data: {
          id: randomUUID(),
          cardUserId: owner.id,
          name: 'Prospect',
          email: `prospect-${marker}@example.com`,
          folderId: folder.id,
        },
      });

      // RESTRICTED_ROUTE / INTERNAL_REDIRECT / EXTERNAL_REDIRECT — fully
      // independent of every other domain, no FK to any legacy entity.
      const restrictedRoute = await legacyPrisma.legacyRestrictedRoute.create({
        data: { id: randomUUID(), endpoint: `/blocked-${marker}` },
      });
      seededLegacyRestrictedRouteIds.push(restrictedRoute.id);
      seededRestrictedPaths.push(`/blocked-${marker}`);

      const redirectRoute = await legacyPrisma.legacyRedirectRoute.create({
        data: {
          id: randomUUID(),
          oldRoute: `/old-${marker}`,
          newRoute: `/new-${marker}`,
          enabled: true,
        },
      });
      seededLegacyRedirectRouteIds.push(redirectRoute.id);
      seededInternalRedirectSourcePaths.push(`/old-${marker}`);

      const externalRedirectRoute =
        await legacyPrisma.legacyExternalRedirectRoute.create({
          data: {
            id: randomUUID(),
            internalPath: `/ext-${marker}`,
            externalUrl: `https://example.com/ext-${marker}`,
            enabled: true,
          },
        });
      seededLegacyExternalRedirectRouteIds.push(externalRedirectRoute.id);
      seededExternalRedirectSourcePaths.push(`/ext-${marker}`);
    });

    it('migrates every domain end-to-end and produces correct, fully-linked new-schema rows', async () => {
      const job = await orchestrator.start(superAdminAccountId);
      const completed = await waitForJobCompletion(job.id);

      expect(completed.status).toBe(MigrationJobStatus.COMPLETED);
      expect(completed.rejectedCount).toBe(0);

      const employee = await prisma.employeeAccount.findUniqueOrThrow({
        where: { email: staffEmail },
      });
      expect(employee.role).toBe(EMPLOYEE_ROLE.ADMIN);

      const ownerAccount = await prisma.customerAccount.findUniqueOrThrow({
        where: { email: ownerEmail },
      });
      const ownerCustomer = await prisma.customer.findUniqueOrThrow({
        where: { accountId: ownerAccount.id },
      });
      expect(ownerCustomer.currentPlanId).not.toBeNull();

      const ownerCredential = await prisma.customerCredential.findFirstOrThrow({
        where: { userId: ownerAccount.id, providerId: 'credential' },
      });
      expect(ownerCredential.password).toBe(legacyBcryptHash);

      const memberAccount = await prisma.customerAccount.findUniqueOrThrow({
        where: { email: memberEmail },
      });
      const googleCredential = await prisma.customerCredential.findFirstOrThrow(
        { where: { userId: memberAccount.id, providerId: 'google' } },
      );
      expect(googleCredential.accountId).toBe(`google-sub-${marker}`);

      const org = await prisma.organisation.findFirstOrThrow({
        where: { name: `Acme ${marker}` },
      });
      expect(org.createdByCustomerId).toBe(ownerCustomer.id);
      const memberCustomer = await prisma.customer.findUniqueOrThrow({
        where: { accountId: memberAccount.id },
      });
      const membership = await prisma.organisationMember.findFirstOrThrow({
        where: { organisationId: org.id, customerId: memberCustomer.id },
      });
      expect(membership.role).toBe('MEMBER');
      expect(membership.status).toBe('ACTIVE');

      const smartCard = await prisma.smartCard.findFirstOrThrow({
        where: { endpoint: `smart-${marker}` },
        include: { profile: true },
      });
      expect(smartCard.customerId).toBe(ownerCustomer.id);
      expect(smartCard.profile?.companyName).toBe('Acme Interiors');

      const ecard = await prisma.eCard.findFirstOrThrow({
        where: { endpoint: `ecard-${marker}` },
        include: {
          components: {
            include: { about: true, whatsapp: true, socialLinks: true },
          },
        },
      });
      expect(ecard.customerId).toBe(ownerCustomer.id);
      expect(ecard.heroEmail).toBe(ownerEmail);
      // Owner is a migrated member (SPOC) of `org` — the ECard migrator
      // auto-links to that membership's organisation.
      expect(ecard.organisationId).toBe(org.id);
      const aboutComponent = ecard.components.find((c) => c.type === 'ABOUT');
      expect(aboutComponent?.about?.profession).toBe('Founder');
      const whatsappComponent = ecard.components.find(
        (c) => c.type === 'WHATSAPP',
      );
      expect(whatsappComponent?.whatsapp).toMatchObject({
        phoneCountryDialCode: '+91',
        phoneNumber: '9876543210',
      });
      const socialComponent = ecard.components.find(
        (c) => c.type === 'SOCIAL_LINKS',
      );
      expect(socialComponent?.socialLinks?.instagram).toBe('acme_official');

      const leadFolder = await prisma.leadFolder.findFirstOrThrow({
        where: { customerId: ownerCustomer.id },
      });
      const lead = await prisma.lead.findFirstOrThrow({
        where: { folderId: leadFolder.id },
      });
      expect(lead.email).toBe(`prospect-${marker}@example.com`);
      expect(lead.sourcedBy).toBe('MANUAL_ENTRY');
      expect(lead.stage).toBeNull();

      const refreshedOwnerCustomer = await prisma.customer.findUniqueOrThrow({
        where: { id: ownerCustomer.id },
      });
      expect(refreshedOwnerCustomer.defaultLeadFolderId).toBe(leadFolder.id);

      const restrictedPath =
        await prisma.restrictedRedirectPath.findUniqueOrThrow({
          where: { path: `/blocked-${marker}` },
        });
      expect(restrictedPath.path).toBe(`/blocked-${marker}`);

      const internalRedirect =
        await prisma.internalRedirectRoute.findUniqueOrThrow({
          where: { sourcePath: `/old-${marker}` },
        });
      expect(internalRedirect.targetPath).toBe(`/new-${marker}`);
      expect(internalRedirect.enabled).toBe(true);
      expect(internalRedirect.createdByEmployeeId).toBeNull();

      const externalRedirect =
        await prisma.externalRedirectRoute.findUniqueOrThrow({
          where: { sourcePath: `/ext-${marker}` },
        });
      expect(externalRedirect.destinationUrl).toBe(
        `https://example.com/ext-${marker}`,
      );
      expect(externalRedirect.enabled).toBe(true);
    });

    it('re-running the pipeline is idempotent — zero new rows, everything reported as skipped', async () => {
      const firstJob = await orchestrator.start(superAdminAccountId);
      const firstCompleted = await waitForJobCompletion(firstJob.id);
      expect(firstCompleted.status).toBe(MigrationJobStatus.COMPLETED);

      const ownerCustomerCountBefore = await prisma.customer.count({
        where: { account: { email: ownerEmail } },
      });
      const smartCardCountBefore = await prisma.smartCard.count({
        where: { endpoint: `smart-${marker}` },
      });
      const internalRedirectCountBefore =
        await prisma.internalRedirectRoute.count({
          where: { sourcePath: `/old-${marker}` },
        });

      const secondJob = await orchestrator.start(superAdminAccountId);
      const secondCompleted = await waitForJobCompletion(secondJob.id);

      expect(secondCompleted.status).toBe(MigrationJobStatus.COMPLETED);
      expect(secondCompleted.successCount).toBe(0);
      expect(secondCompleted.skippedCount).toBeGreaterThan(0);

      const ownerCustomerCountAfter = await prisma.customer.count({
        where: { account: { email: ownerEmail } },
      });
      const smartCardCountAfter = await prisma.smartCard.count({
        where: { endpoint: `smart-${marker}` },
      });
      const internalRedirectCountAfter =
        await prisma.internalRedirectRoute.count({
          where: { sourcePath: `/old-${marker}` },
        });
      expect(ownerCustomerCountAfter).toBe(ownerCustomerCountBefore);
      expect(smartCardCountAfter).toBe(smartCardCountBefore);
      expect(internalRedirectCountAfter).toBe(internalRedirectCountBefore);
    });
  });

  describe('sad paths', () => {
    it('rejects a legacy SmartCard as UNRECOGNIZED_TEMPLATE_SLUG when its template slug has no mapping', async () => {
      const marker = randomUUID().slice(0, 8);
      const owner = await legacyPrisma.legacyCardUser.create({
        data: {
          id: randomUUID(),
          name: 'Slug Test Owner',
          email: `slug-owner-${marker}@example.com`,
          password: null,
        },
      });
      seededLegacyCardUserIds.push(owner.id);
      seededCustomerAccountEmails.push(`slug-owner-${marker}@example.com`);
      const template = await legacyPrisma.legacySmartCardTemplate.create({
        data: {
          id: randomUUID(),
          slug: `unknown.template.${marker}`,
          name: 'Unknown',
        },
      });
      seededLegacySmartCardTemplateIds.push(template.id);
      const legacySmartCard = await legacyPrisma.legacySmartCard.create({
        data: {
          id: randomUUID(),
          cardUserId: owner.id,
          templateId: template.id,
          endpoint: `slug-test-${marker}`,
        },
      });
      seededSmartCardEndpoints.push(`slug-test-${marker}`);

      const job = await orchestrator.start(superAdminAccountId);
      await waitForJobCompletion(job.id);

      const smartCardRecord = await prisma.migrationRecord.findFirstOrThrow({
        where: {
          domain: 'SMART_CARD',
          sourceTable: 'SmartCard',
          sourceId: legacySmartCard.id,
        },
      });
      expect(smartCardRecord.status).toBe('REJECTED');
      expect(smartCardRecord.reason).toBe('UNRECOGNIZED_TEMPLATE_SLUG');
    });

    it('rejects a legacy ECard as OWNING_CUSTOMER_NOT_MIGRATED when its CardUser email collides with an existing target account', async () => {
      const marker = randomUUID().slice(0, 8);
      const collidingEmail = `colliding-${marker}@example.com`;

      // Pre-occupy the target email so CUSTOMER_IDENTITY rejects this CardUser.
      const account = await prisma.customerAccount.create({
        data: {
          name: 'Pre-existing',
          email: collidingEmail,
          emailVerified: true,
        },
      });
      seededCustomerAccountEmails.push(collidingEmail);
      await prisma.customer.create({ data: { accountId: account.id } });

      const legacyOwner = await legacyPrisma.legacyCardUser.create({
        data: {
          id: randomUUID(),
          name: 'Colliding Owner',
          email: collidingEmail,
        },
      });
      seededLegacyCardUserIds.push(legacyOwner.id);
      const legacyEcard = await legacyPrisma.legacyECard.create({
        data: {
          id: randomUUID(),
          cardUserId: legacyOwner.id,
          endpoint: `colliding-ecard-${marker}`,
        },
      });

      const job = await orchestrator.start(superAdminAccountId);
      await waitForJobCompletion(job.id);

      const customerRecord = await prisma.migrationRecord.findFirstOrThrow({
        where: {
          domain: 'CUSTOMER_IDENTITY',
          sourceTable: 'CardUser',
          sourceId: legacyOwner.id,
        },
      });
      expect(customerRecord.status).toBe('REJECTED');
      expect(customerRecord.reason).toBe('EMAIL_ALREADY_EXISTS_IN_TARGET');

      const ecardRecord = await prisma.migrationRecord.findFirstOrThrow({
        where: {
          domain: 'ECARD',
          sourceTable: 'ECard',
          sourceId: legacyEcard.id,
        },
      });
      expect(ecardRecord.status).toBe('REJECTED');
      expect(ecardRecord.reason).toBe('OWNING_CUSTOMER_NOT_MIGRATED');
    });
  });

  describe('authorization', () => {
    it('rejects POST /api/migration/jobs with 403 for a non-super-admin employee', async () => {
      const employeeEmail = `migration-e2e-employee-${randomUUID()}@example.com`;
      const account = await prisma.employeeAccount.create({
        data: {
          name: 'Regular Employee',
          email: employeeEmail,
          emailVerified: true,
          role: EMPLOYEE_ROLE.EMPLOYEE,
        },
      });
      seededEmployeeAccountEmails.push(employeeEmail);
      await prisma.employee.create({ data: { accountId: account.id } });

      await employeeAuth.api.sendVerificationOTP({
        body: { email: account.email, type: 'sign-in' },
      });
      const otp = fakeOtpSender.otpFor(account.email);
      const signInResponse = await employeeAuth.api.signInEmailOTP({
        body: { email: account.email, otp },
        asResponse: true,
      });
      const cookiePairs = signInResponse.headers
        .getSetCookie()
        .map((cookie) => cookie.split(';')[0]);

      await request(app.getHttpServer())
        .post('/api/migration/jobs')
        .set('Cookie', cookiePairs.join('; '))
        .expect(403);
    });
  });
});
