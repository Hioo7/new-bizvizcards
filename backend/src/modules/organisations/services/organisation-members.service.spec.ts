import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { MediaService } from '../../../common/media/media.service';
import type { MediaStorageProviderRegistry } from '../../../common/media/storage/media-storage-provider-registry.provider';
import type {
  MediaStorageProvider,
  UploadMediaParams,
} from '../../../common/media/storage/media-storage-provider.interface';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaSource } from '../../../generated/prisma/client';
import { ORGANISATION_MAX_MEMBERS } from '../organisations.constants';
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

  getPublicUrl(key: string): string {
    return `/media/test-bucket/${key}`;
  }
}

describe('OrganisationMembersService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let organisationsService: OrganisationsService;
  let service: OrganisationMembersService;
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
    organisationsService = new OrganisationsService(prisma, mediaService);
    service = new OrganisationMembersService(prisma, organisationsService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
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

  async function seedCustomer(name = 'Test Customer') {
    const account = await prisma.customerAccount.create({
      data: {
        name,
        email: `organisation-members-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedOrgWithSpoc(name = 'Acme Inc') {
    const spoc = await seedCustomer('SPOC');
    const { organisation } = await organisationsService.create(spoc.id, {
      name,
    });
    seededOrganisationIds.push(organisation.id);
    return { spoc, organisation };
  }

  function spocMembership(spocId: string, organisationId: string) {
    return prisma.organisationMember.findUniqueOrThrow({
      where: {
        customerId_organisationId: { customerId: spocId, organisationId },
      },
    });
  }

  describe('list', () => {
    it('returns the roster including name and email', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      const roster = await service.list(spoc.id, organisation.id);

      expect(roster).toHaveLength(2);
      expect(roster.find((m) => m.customerId === member.id)).toMatchObject({
        name: 'Member One',
        role: 'MEMBER',
      });
    });

    it('rejects a customer who is not a member of that organisation', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const outsider = await seedCustomer('Outsider');

      await expect(service.list(outsider.id, organisation.id)).rejects.toThrow(
        'Customer does not belong to this organisation',
      );
    });

    it('reports linkedEcard as null when the member has no card linked to this organisation', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      const roster = await service.list(spoc.id, organisation.id);

      expect(
        roster.find((m) => m.customerId === member.id)?.linkedEcard,
      ).toBeNull();
    });

    it("reports the member's e-card linked to this organisation", async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const ecard = await prisma.eCard.create({
        data: {
          customerId: member.id,
          organisationId: organisation.id,
          endpoint: `linked-ecard-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
        },
      });

      const roster = await service.list(spoc.id, organisation.id);

      expect(
        roster.find((m) => m.customerId === member.id)?.linkedEcard,
      ).toMatchObject({ id: ecard.id, endpoint: ecard.endpoint });
    });
  });

  describe('update', () => {
    it('lets the SPOC promote a member', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      const updated = await service.update(spoc.id, membership.id, {
        role: 'SPOC',
      });
      expect(updated.role).toBe('SPOC');
    });

    it('rejects a non-SPOC member updating another member', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const memberA = await seedCustomer('Member A');
      const memberBAccount = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: memberA.id },
      });
      const memberB = await seedCustomer('Member B');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: memberB.id },
      });

      await expect(
        service.update(memberA.id, memberBAccount.id, { status: 'SUSPENDED' }),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });

    it('blocks demoting the last remaining SPOC', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const membership = await spocMembership(spoc.id, organisation.id);

      await expect(
        service.update(spoc.id, membership.id, { role: 'MEMBER' }),
      ).rejects.toThrow(
        'Cannot remove or demote the last SPOC of an organisation',
      );
    });

    it("scopes SPOC authority to the acting customer's own organisations", async () => {
      const { organisation: ownOrg } = await seedOrgWithSpoc();
      const spocOfBoth = await seedCustomer('Multi-org SPOC');
      await prisma.organisationMember.create({
        data: {
          organisationId: ownOrg.id,
          customerId: spocOfBoth.id,
          role: 'SPOC',
        },
      });

      const { organisation: otherOrg } = await seedOrgWithSpoc('Other Org');
      const otherMember = await seedCustomer('Other Member');
      const otherMembership = await prisma.organisationMember.create({
        data: { organisationId: otherOrg.id, customerId: otherMember.id },
      });

      await expect(
        service.update(spocOfBoth.id, otherMembership.id, { role: 'SPOC' }),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });
  });

  describe('remove', () => {
    it('lets the SPOC remove a member', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      await service.remove(spoc.id, membership.id);

      await expect(
        prisma.organisationMember.findUnique({ where: { id: membership.id } }),
      ).resolves.toBeNull();
    });

    it('blocks removing the last remaining SPOC', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const membership = await spocMembership(spoc.id, organisation.id);

      await expect(service.remove(spoc.id, membership.id)).rejects.toThrow(
        'Cannot remove or demote the last SPOC of an organisation',
      );
    });
  });

  describe('getMemberInOrganisationOrThrow', () => {
    it('returns the member when it belongs to the given organisation', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      const found = await service.getMemberInOrganisationOrThrow(
        membership.id,
        organisation.id,
      );
      expect(found.id).toBe(membership.id);
    });

    it('throws when the memberId does not exist', async () => {
      const { organisation } = await seedOrgWithSpoc();

      await expect(
        service.getMemberInOrganisationOrThrow(randomUUID(), organisation.id),
      ).rejects.toThrow('Organisation member not found');
    });

    it('throws when the member belongs to a different organisation', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const { organisation: otherOrg } = await seedOrgWithSpoc('Other Org');
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: otherOrg.id, customerId: member.id },
      });

      await expect(
        service.getMemberInOrganisationOrThrow(membership.id, organisation.id),
      ).rejects.toThrow('Organisation member not found');
    });
  });

  describe('employee-facing methods', () => {
    it('removes a member bypassing the SPOC check, but still blocks the last SPOC', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      await service.removeForEmployee(membership.id);
      await expect(
        prisma.organisationMember.findUnique({ where: { id: membership.id } }),
      ).resolves.toBeNull();

      const spocMember = await spocMembership(spoc.id, organisation.id);
      await expect(service.removeForEmployee(spocMember.id)).rejects.toThrow(
        'Cannot remove or demote the last SPOC of an organisation',
      );
    });

    describe('addMembersForEmployee', () => {
      it('adds multiple existing customers as MEMBER by default', async () => {
        const { organisation } = await seedOrgWithSpoc();
        const first = await seedCustomer('New Member One');
        const second = await seedCustomer('New Member Two');

        const created = await service.addMembersForEmployee(organisation.id, {
          customerIds: [first.id, second.id],
          role: 'MEMBER',
        });

        expect(created).toHaveLength(2);
        expect(created.map((m) => m.customerId).sort()).toEqual(
          [first.id, second.id].sort(),
        );
        expect(created.every((m) => m.role === 'MEMBER')).toBe(true);
      });

      it('honors an explicit SPOC role for the whole batch', async () => {
        const { organisation } = await seedOrgWithSpoc();
        const first = await seedCustomer('New Spoc One');
        const second = await seedCustomer('New Spoc Two');

        const created = await service.addMembersForEmployee(organisation.id, {
          customerIds: [first.id, second.id],
          role: 'SPOC',
        });

        expect(created.every((m) => m.role === 'SPOC')).toBe(true);
      });

      it('dedupes duplicate customerIds within the same request', async () => {
        const { organisation } = await seedOrgWithSpoc();
        const customer = await seedCustomer('Duplicate Target');

        const created = await service.addMembersForEmployee(organisation.id, {
          customerIds: [customer.id, customer.id],
          role: 'MEMBER',
        });

        expect(created).toHaveLength(1);
      });

      it('rejects the whole batch when any customer is already a member', async () => {
        const { organisation } = await seedOrgWithSpoc();
        const existingMember = await seedCustomer('Existing Member');
        await prisma.organisationMember.create({
          data: {
            organisationId: organisation.id,
            customerId: existingMember.id,
          },
        });
        const newCustomer = await seedCustomer('New Customer');

        await expect(
          service.addMembersForEmployee(organisation.id, {
            customerIds: [existingMember.id, newCustomer.id],
            role: 'MEMBER',
          }),
        ).rejects.toThrow(
          'One or more selected customers already belong to this organisation',
        );

        const membership = await prisma.organisationMember.findUnique({
          where: {
            customerId_organisationId: {
              customerId: newCustomer.id,
              organisationId: organisation.id,
            },
          },
        });
        expect(membership).toBeNull();
      });

      it('rejects the whole batch when any customerId does not exist', async () => {
        const { organisation } = await seedOrgWithSpoc();
        const realCustomer = await seedCustomer('Real Customer');

        await expect(
          service.addMembersForEmployee(organisation.id, {
            customerIds: [realCustomer.id, randomUUID()],
            role: 'MEMBER',
          }),
        ).rejects.toThrow(
          'One or more customerIds do not reference an existing customer',
        );

        const membership = await prisma.organisationMember.findUnique({
          where: {
            customerId_organisationId: {
              customerId: realCustomer.id,
              organisationId: organisation.id,
            },
          },
        });
        expect(membership).toBeNull();
      });

      it('rejects a batch that would exceed the organisation member limit', async () => {
        const { organisation } = await seedOrgWithSpoc();

        // Fill the organisation to one seat below the cap via bulk inserts
        // (fast, connection-pool-friendly) rather than ORGANISATION_MAX_MEMBERS
        // individual seedCustomer() calls — the org already has 1 member (its
        // SPOC), so ORGANISATION_MAX_MEMBERS - 2 fillers leaves exactly 1 seat.
        const fillerEmails = Array.from(
          { length: ORGANISATION_MAX_MEMBERS - 2 },
          () =>
            `organisation-members-service-filler-${randomUUID()}@example.com`,
        );
        await prisma.customerAccount.createMany({
          data: fillerEmails.map((email) => ({
            name: 'Filler',
            email,
            emailVerified: true,
          })),
        });
        const fillerAccounts = await prisma.customerAccount.findMany({
          where: { email: { in: fillerEmails } },
        });
        seededAccountIds.push(...fillerAccounts.map((a) => a.id));
        await prisma.customer.createMany({
          data: fillerAccounts.map((a) => ({ accountId: a.id })),
        });
        const fillerCustomers = await prisma.customer.findMany({
          where: { accountId: { in: fillerAccounts.map((a) => a.id) } },
        });
        await prisma.organisationMember.createMany({
          data: fillerCustomers.map((c) => ({
            organisationId: organisation.id,
            customerId: c.id,
          })),
        });

        const overflowA = await seedCustomer('Overflow A');
        const overflowB = await seedCustomer('Overflow B');

        await expect(
          service.addMembersForEmployee(organisation.id, {
            customerIds: [overflowA.id, overflowB.id],
            role: 'MEMBER',
          }),
        ).rejects.toThrow(
          `Adding these members would exceed the organisation's limit of ${ORGANISATION_MAX_MEMBERS} members`,
        );
      });

      it('throws when the organisation does not exist', async () => {
        const customer = await seedCustomer();
        await expect(
          service.addMembersForEmployee(randomUUID(), {
            customerIds: [customer.id],
            role: 'MEMBER',
          }),
        ).rejects.toThrow('Organisation not found');
      });
    });

    describe('updateForEmployee', () => {
      it('promotes a member without requiring the actor to be SPOC', async () => {
        const { organisation } = await seedOrgWithSpoc();
        const member = await seedCustomer('Member One');
        const membership = await prisma.organisationMember.create({
          data: { organisationId: organisation.id, customerId: member.id },
        });

        const updated = await service.updateForEmployee(membership.id, {
          role: 'SPOC',
        });
        expect(updated.role).toBe('SPOC');
      });

      it('blocks demoting the last remaining SPOC', async () => {
        const { spoc, organisation } = await seedOrgWithSpoc();
        const membership = await spocMembership(spoc.id, organisation.id);

        await expect(
          service.updateForEmployee(membership.id, { role: 'MEMBER' }),
        ).rejects.toThrow(
          'Cannot remove or demote the last SPOC of an organisation',
        );
      });

      it('updates status independently of role', async () => {
        const { organisation } = await seedOrgWithSpoc();
        const member = await seedCustomer('Member One');
        const membership = await prisma.organisationMember.create({
          data: { organisationId: organisation.id, customerId: member.id },
        });

        const updated = await service.updateForEmployee(membership.id, {
          status: 'SUSPENDED',
        });
        expect(updated.status).toBe('SUSPENDED');
        expect(updated.role).toBe('MEMBER');
      });

      it('throws when the member does not exist', async () => {
        await expect(
          service.updateForEmployee(randomUUID(), { role: 'SPOC' }),
        ).rejects.toThrow('Organisation member not found');
      });
    });
  });
});
