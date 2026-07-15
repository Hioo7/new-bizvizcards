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
import { ORGANISATION_MAX_MEMBERSHIPS_PER_CUSTOMER } from '../organisations.constants';
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

describe('OrganisationsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let mediaService: MediaService;
  let service: OrganisationsService;
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
    mediaService = new MediaService(prisma, registry);
    service = new OrganisationsService(prisma, mediaService);
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
        email: `organisations-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  describe('create', () => {
    it('creates an organisation and makes the creator its SPOC', async () => {
      const customer = await seedCustomer();

      const { organisation, membership } = await service.create(customer.id, {
        name: 'Acme Inc',
      });
      seededOrganisationIds.push(organisation.id);

      expect(organisation.name).toBe('Acme Inc');
      expect(organisation.createdByCustomerId).toBe(customer.id);
      expect(membership.customerId).toBe(customer.id);
      expect(membership.role).toBe('SPOC');
    });

    it('allows creating a second, independent organisation for the same customer', async () => {
      const customer = await seedCustomer();
      const { organisation: first } = await service.create(customer.id, {
        name: 'First',
      });
      seededOrganisationIds.push(first.id);

      const { organisation: second, membership } = await service.create(
        customer.id,
        { name: 'Second' },
      );
      seededOrganisationIds.push(second.id);

      expect(second.id).not.toBe(first.id);
      expect(membership.organisationId).toBe(second.id);

      const memberships = await prisma.organisationMember.findMany({
        where: { customerId: customer.id },
      });
      expect(memberships.map((m) => m.organisationId).sort()).toEqual(
        [first.id, second.id].sort(),
      );
    });

    it('rejects creating more than ORGANISATION_MAX_MEMBERSHIPS_PER_CUSTOMER organisations', async () => {
      const customer = await seedCustomer();
      for (let i = 0; i < ORGANISATION_MAX_MEMBERSHIPS_PER_CUSTOMER; i++) {
        const { organisation } = await service.create(customer.id, {
          name: `Org ${i}`,
        });
        seededOrganisationIds.push(organisation.id);
      }

      await expect(
        service.create(customer.id, { name: 'One too many' }),
      ).rejects.toThrow(
        `This customer already belongs to the maximum of ${ORGANISATION_MAX_MEMBERSHIPS_PER_CUSTOMER} organisations`,
      );
    });
  });

  describe('listMine', () => {
    it('returns an empty array when the customer belongs to no organisation', async () => {
      const customer = await seedCustomer();
      await expect(service.listMine(customer.id)).resolves.toEqual([]);
    });

    it('returns every organisation the customer belongs to', async () => {
      const customer = await seedCustomer();
      const { organisation: first } = await service.create(customer.id, {
        name: 'Acme Inc',
      });
      seededOrganisationIds.push(first.id);
      const { organisation: second } = await service.create(customer.id, {
        name: 'Beta LLC',
      });
      seededOrganisationIds.push(second.id);

      const result = await service.listMine(customer.id);
      expect(result.map((r) => r.organisation.id).sort()).toEqual(
        [first.id, second.id].sort(),
      );
    });
  });

  describe('listMembershipsWithOrgDetails', () => {
    it("resolves each organisation's name and its earliest-joined SPOC email", async () => {
      const spoc = await seedCustomer('Org Spoc');
      const { organisation } = await service.create(spoc.id, {
        name: 'Acme Inc',
      });
      seededOrganisationIds.push(organisation.id);
      const member = await seedCustomer('Org Member');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      const memberResult = await service.listMembershipsWithOrgDetails(
        member.id,
      );
      expect(memberResult).toHaveLength(1);
      expect(memberResult[0]).toMatchObject({
        organisationId: organisation.id,
        organisationName: 'Acme Inc',
        organisationLogoUrl: null,
        role: 'MEMBER',
      });
      expect(memberResult[0].spocEmail).toContain('organisations-service-');
    });

    it('returns an empty array when the customer belongs to no organisation', async () => {
      const customer = await seedCustomer();
      await expect(
        service.listMembershipsWithOrgDetails(customer.id),
      ).resolves.toEqual([]);
    });
  });

  describe('update', () => {
    it('allows the SPOC to rename the organisation', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'Old Name',
      });
      seededOrganisationIds.push(organisation.id);

      const updated = await service.update(customer.id, organisation.id, {
        name: 'New Name',
      });
      expect(updated.name).toBe('New Name');
    });

    it('rejects a non-SPOC member renaming the organisation', async () => {
      const spoc = await seedCustomer();
      const member = await seedCustomer();
      const { organisation } = await service.create(spoc.id, {
        name: 'Acme Inc',
      });
      seededOrganisationIds.push(organisation.id);
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      await expect(
        service.update(member.id, organisation.id, { name: 'Renamed' }),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });

    it('throws when the customer does not belong to that organisation', async () => {
      const customer = await seedCustomer();
      const outsider = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'Acme Inc',
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.update(outsider.id, organisation.id, { name: 'Renamed' }),
      ).rejects.toThrow('Customer does not belong to this organisation');
    });
  });

  describe('multi-org membership', () => {
    it('lets a customer be SPOC of one organisation and MEMBER of another', async () => {
      const customer = await seedCustomer();
      const { organisation: ownOrg } = await service.create(customer.id, {
        name: 'Own Org',
      });
      seededOrganisationIds.push(ownOrg.id);

      const otherSpoc = await seedCustomer();
      const { organisation: otherOrg } = await service.create(otherSpoc.id, {
        name: 'Other Org',
      });
      seededOrganisationIds.push(otherOrg.id);
      await prisma.organisationMember.create({
        data: { organisationId: otherOrg.id, customerId: customer.id },
      });

      await expect(
        service.update(customer.id, ownOrg.id, { name: 'Own Org Renamed' }),
      ).resolves.toMatchObject({ name: 'Own Org Renamed' });
      await expect(
        service.update(customer.id, otherOrg.id, {
          name: 'Should Fail',
        }),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });
  });

  describe('employee-facing methods', () => {
    it('lists organisations with pagination', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: `Paginated Org ${randomUUID()}`,
      });
      seededOrganisationIds.push(organisation.id);

      const result = await service.listAllForEmployee({
        page: 1,
        pageSize: 20,
      });
      expect(result.organisations.map((o) => o.id)).toContain(organisation.id);
    });

    it('gets an organisation by id, throwing when not found', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'Findable Org',
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.getByIdForEmployee(organisation.id),
      ).resolves.toMatchObject({ id: organisation.id, logoUrl: null });
      await expect(service.getByIdForEmployee(randomUUID())).rejects.toThrow(
        'Organisation not found',
      );
    });

    it('removes an organisation', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'Removable Org',
      });

      await service.removeForEmployee(organisation.id);

      await expect(
        prisma.organisation.findUnique({ where: { id: organisation.id } }),
      ).resolves.toBeNull();
    });

    it('lists organisations filtered by a case-insensitive name search', async () => {
      const customer = await seedCustomer();
      const suffix = randomUUID();
      const { organisation: matching } = await service.create(customer.id, {
        name: `Searchable Co ${suffix}`,
      });
      seededOrganisationIds.push(matching.id);
      const { organisation: nonMatching } = await service.create(customer.id, {
        name: `Unrelated ${randomUUID()}`,
      });
      seededOrganisationIds.push(nonMatching.id);

      const result = await service.listAllForEmployee({
        search: `searchable co ${suffix}`,
        page: 1,
        pageSize: 20,
      });

      expect(result.organisations.map((o) => o.id)).toEqual([matching.id]);
    });

    it('renames an organisation without requiring the actor to be its SPOC', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'Old Name',
      });
      seededOrganisationIds.push(organisation.id);

      const updated = await service.updateForEmployee(organisation.id, {
        name: 'New Name',
      });
      expect(updated.name).toBe('New Name');
    });

    it('updateForEmployee throws when the organisation does not exist', async () => {
      await expect(
        service.updateForEmployee(randomUUID(), { name: 'X' }),
      ).rejects.toThrow('Organisation not found');
    });

    it('replaces a logo, linking the new media before deleting the old one', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'Logo Org',
      });
      seededOrganisationIds.push(organisation.id);

      const first = await service.replaceLogo(organisation.id, {
        buffer: Buffer.from('a'),
        contentType: 'image/png',
        originalName: 'a.png',
        extension: 'png',
      });
      expect(first.organisation.logoMediaId).not.toBeNull();
      expect(first.logoUrl).toContain('/media/test-bucket/');
      expect(first.organisation.logoUrl).toBe(first.logoUrl);
      const firstMediaId = first.organisation.logoMediaId as string;

      const second = await service.replaceLogo(organisation.id, {
        buffer: Buffer.from('b'),
        contentType: 'image/png',
        originalName: 'b.png',
        extension: 'png',
      });
      expect(second.organisation.logoMediaId).not.toBe(firstMediaId);

      await expect(
        prisma.media.findUnique({ where: { id: firstMediaId } }),
      ).resolves.toBeNull();
    });

    it('removeLogo is a no-op when there is no existing logo', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'No Logo Org',
      });
      seededOrganisationIds.push(organisation.id);

      const result = await service.removeLogo(organisation.id);
      expect(result.logoMediaId).toBeNull();
    });

    it('removeLogo clears the FK and deletes the media', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'Remove Logo Org',
      });
      seededOrganisationIds.push(organisation.id);
      const uploaded = await service.replaceLogo(organisation.id, {
        buffer: Buffer.from('a'),
        contentType: 'image/png',
        originalName: 'a.png',
        extension: 'png',
      });
      const mediaId = uploaded.organisation.logoMediaId as string;

      const result = await service.removeLogo(organisation.id);
      expect(result.logoMediaId).toBeNull();
      await expect(
        prisma.media.findUnique({ where: { id: mediaId } }),
      ).resolves.toBeNull();
    });
  });
});
