import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { ImageMediaService } from '../../../common/media/image-media.service';
import type { ImageStorageProviderRegistry } from '../../../common/media/storage/image-storage-provider-registry.provider';
import type {
  ImageStorageProvider,
  UploadImageParams,
} from '../../../common/media/storage/image-storage-provider.interface';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ImageSource } from '../../../generated/prisma/client';
import { OrganisationsService } from '../../organisations/services/organisations.service';
import { EcardsService } from './ecards.service';

class FakeImageStorageProvider implements ImageStorageProvider {
  deletedKeys: string[] = [];

  upload(params: UploadImageParams): Promise<void> {
    void params;
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.deletedKeys.push(key);
    return Promise.resolve();
  }

  getPublicUrl(key: string): string {
    return `/media/test-bucket/${key}`;
  }
}

function makeFile(
  fieldname: string,
  content = 'fake-bytes',
): Express.Multer.File {
  return {
    fieldname,
    originalname: 'test.png',
    mimetype: 'image/png',
    buffer: Buffer.from(content),
    size: content.length,
  } as Express.Multer.File;
}

describe('EcardsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let fakeProvider: FakeImageStorageProvider;
  let imageMediaService: ImageMediaService;
  let organisationsService: OrganisationsService;
  let service: EcardsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededOrganisationIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    organisationsService = new OrganisationsService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  beforeEach(() => {
    fakeProvider = new FakeImageStorageProvider();
    const registry: ImageStorageProviderRegistry = {
      [ImageSource.MINIO]: fakeProvider,
    };
    imageMediaService = new ImageMediaService(prisma, registry);
    service = new EcardsService(prisma, imageMediaService);
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
    if (seededEmployeeAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededEmployeeAccountIds } },
      });
      seededEmployeeAccountIds.length = 0;
    }
  });

  async function seedCustomer(name = 'Test Customer') {
    const account = await prisma.customerAccount.create({
      data: {
        name,
        email: `ecards-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedEmployee() {
    const account = await prisma.employeeAccount.create({
      data: {
        name: 'Test Employee',
        email: `ecards-service-employee-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededEmployeeAccountIds.push(account.id);
    return prisma.employee.create({ data: { accountId: account.id } });
  }

  async function seedOrgWithSpoc() {
    const spoc = await seedCustomer('SPOC');
    const { organisation } = await organisationsService.create(spoc.id, {
      name: 'Acme Inc',
    });
    seededOrganisationIds.push(organisation.id);
    return { spoc, organisation };
  }

  describe('createForCustomer', () => {
    it('creates an e-card with all component types and resolves the response', async () => {
      const customer = await seedCustomer('Jane Doe');
      const { organisation } = await seedOrgWithSpoc();
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: customer.id },
      });
      const member = await seedCustomer('Team Mate');
      const memberMembership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `e2e-${randomUUID()}`,
          heroCompanyName: 'Acme',
          phoneCountryDialCode: '91',
          phoneNumber: '9876543210',
          isExchangeContactEnabled: true,
          heroProfilePhoto: { action: 'upload' },
          components: [
            {
              type: 'ABOUT',
              profession: 'Designer',
              shortNote: 'Hi there',
            },
            { type: 'SOCIAL_LINKS', website: 'https://example.com' },
            {
              type: 'VIDEO',
              videoUrl: 'https://www.youtube.com/embed/abc123',
            },
            {
              type: 'GALLERY',
              subGalleries: [
                {
                  title: 'Work',
                  images: [{ action: 'upload' }],
                },
              ],
            },
            {
              type: 'TEAM',
              members: [{ organisationMemberId: memberMembership.id }],
            },
          ],
        },
        [makeFile('heroProfilePhoto'), makeFile('galleryImage_0_0')],
      );

      expect(created.endpoint).toMatch(/^e2e-/);
      expect(created.hero.name).toBe('Jane Doe');
      expect(created.hero.profilePhotoUrl).toContain('/media/test-bucket/');
      expect(created.components).toHaveLength(5);

      const about = created.components.find((c) => c.type === 'ABOUT');
      expect(about).toMatchObject({ profession: 'Designer' });

      const gallery = created.components.find((c) => c.type === 'GALLERY');
      expect(gallery?.subGalleries).toHaveLength(1);
      expect(gallery?.subGalleries[0].images).toHaveLength(1);

      const team = created.components.find((c) => c.type === 'TEAM');
      expect(team?.members).toEqual([
        expect.objectContaining({
          organisationMemberId: memberMembership.id,
          name: 'Team Mate',
        }),
      ]);
    });

    it('rejects creating a second e-card for the same customer', async () => {
      const customer = await seedCustomer();
      await service.createForCustomer(
        customer.id,
        { endpoint: `first-${randomUUID()}`, components: [] },
        [],
      );

      await expect(
        service.createForCustomer(
          customer.id,
          { endpoint: `second-${randomUUID()}`, components: [] },
          [],
        ),
      ).rejects.toThrow('This customer already has an e-card');
    });

    it('rejects an endpoint already in use', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const endpoint = `dup-${randomUUID()}`;
      await service.createForCustomer(
        customerA.id,
        { endpoint, components: [] },
        [],
      );

      await expect(
        service.createForCustomer(
          customerB.id,
          { endpoint, components: [] },
          [],
        ),
      ).rejects.toThrow('Endpoint already in use');
    });

    it('rejects a TEAM component when the owner has no organisation', async () => {
      const customer = await seedCustomer();
      await expect(
        service.createForCustomer(
          customer.id,
          {
            endpoint: `no-org-${randomUUID()}`,
            components: [
              {
                type: 'TEAM',
                members: [{ organisationMemberId: randomUUID() }],
              },
            ],
          },
          [],
        ),
      ).rejects.toThrow(
        'Cannot add team members: this customer does not belong to an organisation',
      );
    });

    it('rejects a TEAM member from a different organisation', async () => {
      const { organisation: ownOrg } = await seedOrgWithSpoc();
      const owner = await seedCustomer('Owner');
      await prisma.organisationMember.create({
        data: { organisationId: ownOrg.id, customerId: owner.id },
      });

      const { organisation: otherOrg } = await seedOrgWithSpoc();
      const outsider = await seedCustomer('Outsider');
      const outsiderMembership = await prisma.organisationMember.create({
        data: { organisationId: otherOrg.id, customerId: outsider.id },
      });

      await expect(
        service.createForCustomer(
          owner.id,
          {
            endpoint: `cross-org-${randomUUID()}`,
            components: [
              {
                type: 'TEAM',
                members: [{ organisationMemberId: outsiderMembership.id }],
              },
            ],
          },
          [],
        ),
      ).rejects.toThrow(
        'One or more team members do not belong to your organisation',
      );
    });
  });

  describe('createAsEmployee', () => {
    it('resolves the employee business row and sets createdByEmployeeId', async () => {
      const employee = await seedEmployee();
      const customer = await seedCustomer();

      const created = await service.createAsEmployee(
        employee.accountId,
        {
          customerId: customer.id,
          endpoint: `emp-${randomUUID()}`,
          components: [],
        },
        [],
      );

      expect(created.createdByEmployeeId).toBe(employee.id);
    });

    it('rejects a customerId that does not exist', async () => {
      const employee = await seedEmployee();
      await expect(
        service.createAsEmployee(
          employee.accountId,
          {
            customerId: randomUUID(),
            endpoint: `emp-bad-${randomUUID()}`,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow('customerId does not reference an existing customer');
    });
  });

  describe('getByCustomerId', () => {
    it('returns null when the customer has no e-card', async () => {
      const customer = await seedCustomer();
      await expect(service.getByCustomerId(customer.id)).resolves.toBeNull();
    });
  });

  describe('updateByCustomerId (full replace)', () => {
    it('replaces components, keeps an existing gallery image, and orphans the replaced hero photo', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `upd-${randomUUID()}`,
          heroProfilePhoto: { action: 'upload' },
          components: [
            {
              type: 'GALLERY',
              subGalleries: [{ images: [{ action: 'upload' }] }],
            },
          ],
        },
        [makeFile('heroProfilePhoto'), makeFile('galleryImage_0_0')],
      );
      const originalHeroMediaId = created.hero.profilePhotoMediaId as string;
      const createdGallery = created.components.find(
        (c) => c.type === 'GALLERY',
      );
      const keptImageMediaId = createdGallery?.subGalleries[0].images[0]
        .imageMediaId as string;

      const updated = await service.updateByCustomerId(
        customer.id,
        {
          endpoint: created.endpoint,
          heroProfilePhoto: { action: 'upload' },
          components: [
            {
              type: 'ABOUT',
              profession: 'Updated Profession',
            },
            {
              type: 'GALLERY',
              subGalleries: [
                {
                  images: [{ action: 'keep', mediaId: keptImageMediaId }],
                },
              ],
            },
          ],
        },
        [makeFile('heroProfilePhoto')],
      );

      expect(updated.components).toHaveLength(2);
      expect(updated.components[0]).toMatchObject({
        type: 'ABOUT',
        profession: 'Updated Profession',
      });
      const updatedGallery = updated.components.find(
        (c) => c.type === 'GALLERY',
      );
      expect(updatedGallery?.subGalleries[0].images[0].imageMediaId).toBe(
        keptImageMediaId,
      );
      expect(updated.hero.profilePhotoMediaId).not.toBe(originalHeroMediaId);
      expect(fakeProvider.deletedKeys.length).toBeGreaterThan(0);

      // the replaced hero photo's ImageMedia row is gone
      await expect(
        prisma.imageMedia.findUnique({ where: { id: originalHeroMediaId } }),
      ).resolves.toBeNull();
      // the kept gallery image's row survives
      await expect(
        prisma.imageMedia.findUnique({ where: { id: keptImageMediaId } }),
      ).resolves.not.toBeNull();
    });

    it('rejects a "keep" slot referencing a mediaId that does not belong to this card', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        { endpoint: `keep-bad-${randomUUID()}`, components: [] },
        [],
      );

      await expect(
        service.updateByCustomerId(
          customer.id,
          {
            endpoint: created.endpoint,
            components: [
              {
                type: 'GALLERY',
                subGalleries: [
                  { images: [{ action: 'keep', mediaId: randomUUID() }] },
                ],
              },
            ],
          },
          [],
        ),
      ).rejects.toThrow('mediaId does not belong to this e-card');
    });

    it('throws when the customer has no e-card', async () => {
      const customer = await seedCustomer();
      await expect(
        service.updateByCustomerId(
          customer.id,
          { endpoint: `none-${randomUUID()}`, components: [] },
          [],
        ),
      ).rejects.toThrow('E-card not found');
    });
  });

  describe('removeByCustomerId', () => {
    it('deletes the card and its media', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `rm-${randomUUID()}`,
          heroProfilePhoto: { action: 'upload' },
          components: [],
        },
        [makeFile('heroProfilePhoto')],
      );
      const mediaId = created.hero.profilePhotoMediaId as string;

      await service.removeByCustomerId(customer.id);

      await expect(
        prisma.eCard.findUnique({ where: { customerId: customer.id } }),
      ).resolves.toBeNull();
      await expect(
        prisma.imageMedia.findUnique({ where: { id: mediaId } }),
      ).resolves.toBeNull();
    });
  });

  describe('getById / getByEndpoint / list', () => {
    it('404s for an unknown id and an unknown endpoint', async () => {
      await expect(service.getById(randomUUID())).rejects.toThrow(
        'E-card not found',
      );
      await expect(service.getByEndpoint('does-not-exist')).rejects.toThrow(
        'E-card not found',
      );
    });

    it('lists e-cards filtered by customerId', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        { endpoint: `list-${randomUUID()}`, components: [] },
        [],
      );

      const result = await service.list({
        customerId: customer.id,
        page: 1,
        pageSize: 20,
      });

      expect(result.ecards.map((c) => c.id)).toEqual([created.id]);
    });
  });
});
