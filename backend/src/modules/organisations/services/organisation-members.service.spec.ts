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
  });
});
