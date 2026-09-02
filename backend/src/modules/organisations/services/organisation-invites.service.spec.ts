import { randomUUID } from 'crypto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { createCustomerAuth } from '../../../common/auth/customer-auth.factory';
import type { CustomerAuth } from '../../../common/auth/customer-auth.factory';
import { AppConfigService } from '../../../common/config/app-config.service';
import { MailerService } from '../../../common/mailer/mailer.service';
import { MediaService } from '../../../common/media/media.service';
import type { MediaStorageProviderRegistry } from '../../../common/media/storage/media-storage-provider-registry.provider';
import type {
  MediaStorageProvider,
  UploadMediaParams,
} from '../../../common/media/storage/media-storage-provider.interface';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaSource } from '../../../generated/prisma/client';
import { CustomersService } from '../../customers/services/customers.service';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { ORGANISATION_MAX_MEMBERS } from '../organisations.constants';
import { OrganisationInvitesService } from './organisation-invites.service';
import { OrganisationMembersService } from './organisation-members.service';
import { OrganisationsService } from './organisations.service';

class FakeMediaStorageProvider implements MediaStorageProvider {
  upload(params: UploadMediaParams): Promise<void> {
    void params;
    return Promise.resolve();
  }

  delete(): Promise<void> {
    return Promise.resolve();
  }

  download(key: string): Promise<Buffer> {
    void key;
    return Promise.resolve(Buffer.alloc(0));
  }

  getPublicUrl(key: string): string {
    return `/media/test-bucket/${key}`;
  }
}

describe('OrganisationInvitesService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let organisationsService: OrganisationsService;
  let organisationMembersService: OrganisationMembersService;
  let customersService: CustomersService;
  let mailer: MailerService & { sendMail: jest.Mock };
  let service: OrganisationInvitesService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededOrganisationIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    // The email self-serve flow is off by default (see env.schema.ts) — this
    // suite's main `service` instance runs with it explicitly on, so every
    // pre-existing invite/accept test below keeps exercising that behavior
    // unchanged. The "email invite flow toggle" describe block further down
    // builds a second, disabled instance to test the gating itself.
    process.env.ORGANISATION_EMAIL_INVITES_ENABLED = 'true';

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    const registry: MediaStorageProviderRegistry = {
      [MediaSource.MINIO]: new FakeMediaStorageProvider(),
    };
    const mediaService = new MediaService(prisma, registry);
    const planEnforcementService = new PlanEnforcementService(
      prisma,
      new PlanPolicyResolverService(prisma),
    );
    organisationsService = new OrganisationsService(
      prisma,
      mediaService,
      planEnforcementService,
    );
    organisationMembersService = new OrganisationMembersService(
      prisma,
      organisationsService,
      planEnforcementService,
      mediaService,
    );
    const customerAuth: CustomerAuth = createCustomerAuth({
      secret: appConfig.betterAuthCustomerSecret,
      baseUrl: appConfig.betterAuthUrl,
      publicAppBaseUrl: appConfig.publicAppBaseUrl,
      trustedFrontendOrigins: appConfig.corsAllowedOrigins,
      prisma,
    });
    customersService = new CustomersService(prisma, mediaService, customerAuth);
    mailer = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    } as unknown as MailerService & { sendMail: jest.Mock };
    service = new OrganisationInvitesService(
      prisma,
      organisationsService,
      organisationMembersService,
      customersService,
      mailer,
      appConfig,
      planEnforcementService,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    mailer.sendMail.mockClear();
    if (seededOrganisationIds.length > 0) {
      await prisma.organisation.deleteMany({
        where: { id: { in: seededOrganisationIds } },
      });
      seededOrganisationIds.length = 0;
    }
    if (seededAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
    if (seededEmployeeAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededEmployeeAccountIds } },
      });
      seededEmployeeAccountIds.length = 0;
    }
  });

  async function seedCustomer(email?: string) {
    const account = await prisma.customerAccount.create({
      data: {
        name: 'Test Customer',
        email:
          email ?? `organisation-invites-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedEmployee() {
    const account = await prisma.employeeAccount.create({
      data: {
        name: 'Resolving Employee',
        email: `organisation-invites-employee-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'admin',
      },
    });
    seededEmployeeAccountIds.push(account.id);
    const employee = await prisma.employee.create({
      data: { accountId: account.id },
    });
    return { accountId: account.id, employeeId: employee.id };
  }

  async function seedOrgWithSpoc(name = 'Acme Inc') {
    const spoc = await seedCustomer();
    const { organisation } = await organisationsService.create(spoc.id, {
      name,
    });
    seededOrganisationIds.push(organisation.id);
    return { spoc, organisation };
  }

  describe('invite', () => {
    it('creates a pending invite and sends an email', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const inviteeEmail = `invitee-${randomUUID()}@example.com`;

      const invite = await service.invite(spoc.id, organisation.id, {
        email: inviteeEmail,
        role: 'MEMBER',
      });

      expect(invite.organisationId).toBe(organisation.id);
      expect(invite.status).toBe('PENDING');
      expect(invite.token).toHaveLength(64);
      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: inviteeEmail }),
      );
    });

    it('rejects a non-SPOC sending an invite', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer();
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      await expect(
        service.invite(member.id, organisation.id, {
          email: `invitee-${randomUUID()}@example.com`,
          role: 'MEMBER',
        }),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });

    it('rejects inviting an email that already belongs to the organisation', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const spocAccount = await prisma.customerAccount.findUniqueOrThrow({
        where: { id: spoc.accountId },
      });

      await expect(
        service.invite(spoc.id, organisation.id, {
          email: spocAccount.email,
          role: 'MEMBER',
        }),
      ).rejects.toThrow('This person is already a member of the organisation');
    });

    it('rejects inviting once the organisation is at its member cap', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const extraMembers = ORGANISATION_MAX_MEMBERS - 1;
      const members = await Promise.all(
        Array.from({ length: extraMembers }, () => seedCustomer()),
      );
      await prisma.organisationMember.createMany({
        data: members.map((member) => ({
          organisationId: organisation.id,
          customerId: member.id,
        })),
      });

      await expect(
        service.invite(spoc.id, organisation.id, {
          email: `invitee-${randomUUID()}@example.com`,
          role: 'MEMBER',
        }),
      ).rejects.toThrow('Organisation has reached its member limit');
    });
  });

  describe('list and revoke', () => {
    it('lists only pending invites and revoke marks them REVOKED', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });

      const pending = await service.list(spoc.id, organisation.id);
      expect(pending.map((i) => i.id)).toContain(invite.id);

      await service.revoke(spoc.id, invite.id);

      const afterRevoke = await service.list(spoc.id, organisation.id);
      expect(afterRevoke.map((i) => i.id)).not.toContain(invite.id);

      const revoked = await prisma.organisationInvite.findUniqueOrThrow({
        where: { id: invite.id },
      });
      expect(revoked.status).toBe('REVOKED');
    });

    it("rejects revoking an invite that belongs to a different organisation than the acting SPOC's", async () => {
      const { organisation } = await seedOrgWithSpoc();
      const invite = await prisma.organisationInvite.create({
        data: {
          organisationId: organisation.id,
          email: `invitee-${randomUUID()}@example.com`,
          role: 'MEMBER',
          token: randomUUID(),
          invitedByCustomerId: (await seedCustomer()).id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      });
      const { spoc: otherSpoc } = await seedOrgWithSpoc('Other Org');

      await expect(service.revoke(otherSpoc.id, invite.id)).rejects.toThrow(
        'Only the organisation SPOC can perform this action',
      );
    });
  });

  describe('accept', () => {
    it('creates a membership and marks the invite ACCEPTED when the email matches', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const inviteeEmail = `invitee-${randomUUID()}@example.com`;
      const invite = await service.invite(spoc.id, organisation.id, {
        email: inviteeEmail,
        role: 'MEMBER',
      });
      const invitee = await seedCustomer(inviteeEmail);

      await service.accept(invitee.id, inviteeEmail, invite.token);

      const membership = await prisma.organisationMember.findUniqueOrThrow({
        where: {
          customerId_organisationId: {
            customerId: invitee.id,
            organisationId: organisation.id,
          },
        },
      });
      expect(membership.organisationId).toBe(organisation.id);

      const acceptedInvite = await prisma.organisationInvite.findUniqueOrThrow({
        where: { id: invite.id },
      });
      expect(acceptedInvite.status).toBe('ACCEPTED');
      expect(acceptedInvite.acceptedByCustomerId).toBe(invitee.id);
    });

    it('rejects acceptance when the authenticated email does not match the invite', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });
      const wrongPerson = await seedCustomer();

      await expect(
        service.accept(
          wrongPerson.id,
          'someone-else@example.com',
          invite.token,
        ),
      ).rejects.toThrow('This invite was sent to a different email address');
    });

    it('rejects acceptance of an expired invite and marks it EXPIRED', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const inviteeEmail = `invitee-${randomUUID()}@example.com`;
      const invite = await service.invite(spoc.id, organisation.id, {
        email: inviteeEmail,
        role: 'MEMBER',
      });
      await prisma.organisationInvite.update({
        where: { id: invite.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      const invitee = await seedCustomer(inviteeEmail);

      await expect(
        service.accept(invitee.id, inviteeEmail, invite.token),
      ).rejects.toThrow('This invite has expired');

      const expired = await prisma.organisationInvite.findUniqueOrThrow({
        where: { id: invite.id },
      });
      expect(expired.status).toBe('EXPIRED');
    });

    it('allows a customer to accept invites into multiple different organisations', async () => {
      const { spoc: firstSpoc, organisation: firstOrg } =
        await seedOrgWithSpoc('First Org');
      const { spoc: secondSpoc, organisation: secondOrg } =
        await seedOrgWithSpoc('Second Org');
      const inviteeEmail = `invitee-${randomUUID()}@example.com`;
      const invitee = await seedCustomer(inviteeEmail);

      const firstInvite = await service.invite(firstSpoc.id, firstOrg.id, {
        email: inviteeEmail,
        role: 'MEMBER',
      });
      const secondInvite = await service.invite(secondSpoc.id, secondOrg.id, {
        email: inviteeEmail,
        role: 'MEMBER',
      });

      await service.accept(invitee.id, inviteeEmail, firstInvite.token);
      await service.accept(invitee.id, inviteeEmail, secondInvite.token);

      const memberships = await prisma.organisationMember.findMany({
        where: { customerId: invitee.id },
      });
      expect(memberships.map((m) => m.organisationId).sort()).toEqual(
        [firstOrg.id, secondOrg.id].sort(),
      );
    });

    it('rejects accepting a second invite into the same organisation already joined', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const inviteeEmail = `invitee-${randomUUID()}@example.com`;
      const invitee = await seedCustomer(inviteeEmail);
      const firstInvite = await service.invite(spoc.id, organisation.id, {
        email: inviteeEmail,
        role: 'MEMBER',
      });
      await service.accept(invitee.id, inviteeEmail, firstInvite.token);

      await prisma.organisationInvite.update({
        where: { id: firstInvite.id },
        data: { status: 'PENDING' },
      });

      await expect(
        service.accept(invitee.id, inviteeEmail, firstInvite.token),
      ).rejects.toThrow('Customer already belongs to this organisation');
    });

    it('rejects an unknown token', async () => {
      const customer = await seedCustomer();
      await expect(
        service.accept(customer.id, 'unused@example.com', 'not-a-real-token'),
      ).rejects.toThrow('Invite not found or no longer valid');
    });
  });

  describe('email invite flow toggle', () => {
    it('does not send an email when the flow is disabled, but still creates the invite', async () => {
      process.env.ORGANISATION_EMAIL_INVITES_ENABLED = 'false';
      const disabledAppConfig = new AppConfigService();
      process.env.ORGANISATION_EMAIL_INVITES_ENABLED = 'true';
      const disabledMailer = {
        sendMail: jest.fn().mockResolvedValue(undefined),
      } as unknown as MailerService & { sendMail: jest.Mock };
      const disabledService = new OrganisationInvitesService(
        prisma,
        organisationsService,
        organisationMembersService,
        customersService,
        disabledMailer,
        disabledAppConfig,
        new PlanEnforcementService(
          prisma,
          new PlanPolicyResolverService(prisma),
        ),
      );

      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await disabledService.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });

      expect(invite.status).toBe('PENDING');
      expect(disabledMailer.sendMail).not.toHaveBeenCalled();
    });

    it('rejects self-serve accept when the flow is disabled', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const inviteeEmail = `invitee-${randomUUID()}@example.com`;
      const invite = await service.invite(spoc.id, organisation.id, {
        email: inviteeEmail,
        role: 'MEMBER',
      });
      const invitee = await seedCustomer(inviteeEmail);

      process.env.ORGANISATION_EMAIL_INVITES_ENABLED = 'false';
      const disabledAppConfig = new AppConfigService();
      process.env.ORGANISATION_EMAIL_INVITES_ENABLED = 'true';
      const disabledService = new OrganisationInvitesService(
        prisma,
        organisationsService,
        organisationMembersService,
        customersService,
        mailer,
        disabledAppConfig,
        new PlanEnforcementService(
          prisma,
          new PlanPolicyResolverService(prisma),
        ),
      );

      await expect(
        disabledService.accept(invitee.id, inviteeEmail, invite.token),
      ).rejects.toThrow('Self-serve invite acceptance is currently disabled');
    });
  });

  describe('lookupPublic', () => {
    it('returns invite context for a valid token', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc('Lookup Org');
      const inviteeEmail = `invitee-${randomUUID()}@example.com`;
      const invite = await service.invite(spoc.id, organisation.id, {
        email: inviteeEmail,
        role: 'MEMBER',
      });

      const lookup = await service.lookupPublic(invite.token);

      expect(lookup).toMatchObject({
        organisationName: 'Lookup Org',
        email: inviteeEmail,
        role: 'MEMBER',
        status: 'PENDING',
        emailFlowEnabled: true,
      });
    });

    it('reports an effective EXPIRED status without mutating the row', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });
      await prisma.organisationInvite.update({
        where: { id: invite.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const lookup = await service.lookupPublic(invite.token);
      expect(lookup.status).toBe('EXPIRED');

      const stillPending = await prisma.organisationInvite.findUniqueOrThrow({
        where: { id: invite.id },
      });
      expect(stillPending.status).toBe('PENDING');
    });

    it('rejects an unknown token', async () => {
      await expect(service.lookupPublic('not-a-real-token')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listForEmployee', () => {
    it('lists every invite for the organisation with joined names', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });

      const invites = await service.listForEmployee(organisation.id);

      expect(invites).toHaveLength(1);
      expect(invites[0]).toMatchObject({
        id: invite.id,
        status: 'PENDING',
        invitedByName: 'Test Customer',
        acceptedByCustomerName: null,
        resolvedByEmployeeName: null,
      });
    });

    it('rejects an unknown organisation', async () => {
      await expect(service.listForEmployee(randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('linkExistingCustomerForEmployee', () => {
    it('links an existing customer and resolves the invite', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });
      const existingCustomer = await seedCustomer();
      const employee = await seedEmployee();

      await service.linkExistingCustomerForEmployee(
        employee.accountId,
        organisation.id,
        invite.id,
        existingCustomer.id,
      );

      const membership = await prisma.organisationMember.findUniqueOrThrow({
        where: {
          customerId_organisationId: {
            customerId: existingCustomer.id,
            organisationId: organisation.id,
          },
        },
      });
      expect(membership.role).toBe('MEMBER');

      const resolved = await prisma.organisationInvite.findUniqueOrThrow({
        where: { id: invite.id },
      });
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.acceptedByCustomerId).toBe(existingCustomer.id);
      expect(resolved.resolvedByEmployeeId).toBe(employee.employeeId);
    });

    it('rejects linking a customer who already belongs to the organisation', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });
      const employee = await seedEmployee();

      await expect(
        service.linkExistingCustomerForEmployee(
          employee.accountId,
          organisation.id,
          invite.id,
          spoc.id,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects an invite that does not belong to the organisation', async () => {
      const { organisation: otherOrg } = await seedOrgWithSpoc('Other Org');
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });
      const existingCustomer = await seedCustomer();
      const employee = await seedEmployee();

      await expect(
        service.linkExistingCustomerForEmployee(
          employee.accountId,
          otherOrg.id,
          invite.id,
          existingCustomer.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects resolving an already-resolved invite', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });
      const employee = await seedEmployee();
      const firstCustomer = await seedCustomer();
      await service.linkExistingCustomerForEmployee(
        employee.accountId,
        organisation.id,
        invite.id,
        firstCustomer.id,
      );

      const secondCustomer = await seedCustomer();
      await expect(
        service.linkExistingCustomerForEmployee(
          employee.accountId,
          organisation.id,
          invite.id,
          secondCustomer.id,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createAndLinkCustomerForEmployee', () => {
    it('creates a new customer, links them, and resolves the invite', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'SPOC',
      });
      const employee = await seedEmployee();
      const newCustomerEmail = `created-${randomUUID()}@example.com`;

      await service.createAndLinkCustomerForEmployee(
        employee.accountId,
        organisation.id,
        invite.id,
        {
          name: 'New Org Member',
          email: newCustomerEmail,
          password: 'a-strong-password',
        },
      );

      const account = await prisma.customerAccount.findUniqueOrThrow({
        where: { email: newCustomerEmail },
      });
      seededAccountIds.push(account.id);
      const customer = await prisma.customer.findUniqueOrThrow({
        where: { accountId: account.id },
      });

      const membership = await prisma.organisationMember.findUniqueOrThrow({
        where: {
          customerId_organisationId: {
            customerId: customer.id,
            organisationId: organisation.id,
          },
        },
      });
      expect(membership.role).toBe('SPOC');

      const resolved = await prisma.organisationInvite.findUniqueOrThrow({
        where: { id: invite.id },
      });
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.acceptedByCustomerId).toBe(customer.id);
      expect(resolved.resolvedByEmployeeId).toBe(employee.employeeId);
    });

    it('rejects creating an account with a duplicate email', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });
      const employee = await seedEmployee();
      const existing = await seedCustomer();
      const existingAccount = await prisma.customerAccount.findUniqueOrThrow({
        where: { id: existing.accountId },
      });

      await expect(
        service.createAndLinkCustomerForEmployee(
          employee.accountId,
          organisation.id,
          invite.id,
          {
            name: 'Duplicate',
            email: existingAccount.email,
            password: 'a-strong-password',
          },
        ),
      ).rejects.toThrow();
    });
  });

  describe('revokeForEmployee', () => {
    it('revokes a pending invite', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });
      const employee = await seedEmployee();

      await service.revokeForEmployee(
        employee.accountId,
        organisation.id,
        invite.id,
      );

      const revoked = await prisma.organisationInvite.findUniqueOrThrow({
        where: { id: invite.id },
      });
      expect(revoked.status).toBe('REVOKED');
      expect(revoked.resolvedByEmployeeId).toBe(employee.employeeId);
    });

    it('rejects revoking an already-resolved invite', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const invite = await service.invite(spoc.id, organisation.id, {
        email: `invitee-${randomUUID()}@example.com`,
        role: 'MEMBER',
      });
      const employee = await seedEmployee();
      await service.revokeForEmployee(
        employee.accountId,
        organisation.id,
        invite.id,
      );

      await expect(
        service.revokeForEmployee(
          employee.accountId,
          organisation.id,
          invite.id,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
