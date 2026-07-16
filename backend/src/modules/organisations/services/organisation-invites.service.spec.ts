import { randomUUID } from 'crypto';
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
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { ORGANISATION_MAX_MEMBERS } from '../organisations.constants';
import { OrganisationInvitesService } from './organisation-invites.service';
import { OrganisationsService } from './organisations.service';

class FakeMediaStorageProvider implements MediaStorageProvider {
  upload(params: UploadMediaParams): Promise<void> {
    void params;
    return Promise.resolve();
  }

  delete(): Promise<void> {
    return Promise.resolve();
  }

  getPublicUrl(key: string): string {
    return `/media/test-bucket/${key}`;
  }
}

describe('OrganisationInvitesService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let organisationsService: OrganisationsService;
  let mailer: MailerService & { sendMail: jest.Mock };
  let service: OrganisationInvitesService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededOrganisationIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

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
    mailer = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    } as unknown as MailerService & { sendMail: jest.Mock };
    service = new OrganisationInvitesService(
      prisma,
      organisationsService,
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
});
