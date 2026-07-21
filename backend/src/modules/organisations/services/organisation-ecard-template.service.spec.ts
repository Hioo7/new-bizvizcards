import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { MediaSlotResolverService } from '../../../common/media/media-slot-resolver.service';
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
import { OrganisationEcardTemplateService } from './organisation-ecard-template.service';
import { OrganisationsService } from './organisations.service';

class FakeMediaStorageProvider implements MediaStorageProvider {
  deletedKeys: string[] = [];

  upload(params: UploadMediaParams): Promise<void> {
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

describe('OrganisationEcardTemplateService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let fakeProvider: FakeMediaStorageProvider;
  let mediaService: MediaService;
  let organisationsService: OrganisationsService;
  let planEnforcementService: PlanEnforcementService;
  let service: OrganisationEcardTemplateService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededOrganisationIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    const bootstrapRegistry: MediaStorageProviderRegistry = {
      [MediaSource.MINIO]: new FakeMediaStorageProvider(),
    };
    planEnforcementService = new PlanEnforcementService(
      prisma,
      new PlanPolicyResolverService(prisma),
    );
    organisationsService = new OrganisationsService(
      prisma,
      new MediaService(prisma, bootstrapRegistry),
      planEnforcementService,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  beforeEach(() => {
    fakeProvider = new FakeMediaStorageProvider();
    const registry: MediaStorageProviderRegistry = {
      [MediaSource.MINIO]: fakeProvider,
    };
    mediaService = new MediaService(prisma, registry);
    service = new OrganisationEcardTemplateService(
      prisma,
      mediaService,
      new MediaSlotResolverService(mediaService),
      organisationsService,
    );
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
        email: `org-ecard-template-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedOrgWithSpoc() {
    const spoc = await seedCustomer('SPOC');
    const { organisation } = await organisationsService.create(spoc.id, {
      name: 'Acme Inc',
    });
    seededOrganisationIds.push(organisation.id);
    return { spoc, organisation };
  }

  describe('getByOrganisationId', () => {
    it('returns null when the organisation has no template yet', async () => {
      const { organisation } = await seedOrgWithSpoc();

      await expect(
        service.getByOrganisationId(organisation.id),
      ).resolves.toBeNull();
    });
  });

  describe('upsertForEmployee', () => {
    it('creates a template with all component types, every field optional and honoured', async () => {
      const { organisation } = await seedOrgWithSpoc();

      const created = await service.upsertForEmployee(
        organisation.id,
        {
          heroCompanyName: 'Acme Corp',
          heroProfilePhoto: { action: 'upload' },
          components: [
            { type: 'ABOUT', shortNote: 'Welcome to Acme' },
            { type: 'SOCIAL_LINKS', website: 'https://acme.test' },
            { type: 'WHATSAPP', phoneCountryDialCode: '91' },
          ],
        },
        [makeFile('heroProfilePhoto')],
      );

      expect(created.hero.companyName).toBe('Acme Corp');
      expect(created.hero.name).toBeNull();
      expect(created.hero.profilePhotoUrl).toContain('/media/test-bucket/');
      expect(created.components).toHaveLength(3);

      const whatsapp = created.components.find((c) => c.type === 'WHATSAPP');
      expect(whatsapp).toMatchObject({
        phoneCountryDialCode: '91',
        phoneNumber: null,
      });
    });

    it('fully replaces components on a second save and cleans up orphaned media', async () => {
      const { organisation } = await seedOrgWithSpoc();
      await service.upsertForEmployee(
        organisation.id,
        {
          heroProfilePhoto: { action: 'upload' },
          components: [{ type: 'ABOUT', shortNote: 'First save' }],
        },
        [makeFile('heroProfilePhoto')],
      );

      const updated = await service.upsertForEmployee(
        organisation.id,
        {
          components: [{ type: 'SOCIAL_LINKS', website: 'https://acme.test' }],
        },
        [],
      );

      expect(updated.components.map((c) => c.type)).toEqual(['SOCIAL_LINKS']);
      expect(updated.hero.profilePhotoMediaId).toBeNull();
      expect(fakeProvider.deletedKeys).toHaveLength(1);
    });

    it('clears a previously set hero field when it is left blank on a later save', async () => {
      const { organisation } = await seedOrgWithSpoc();
      await service.upsertForEmployee(
        organisation.id,
        { heroCompanyName: 'Acme Corp', components: [] },
        [],
      );

      const updated = await service.upsertForEmployee(
        organisation.id,
        { components: [] },
        [],
      );

      expect(updated.hero.companyName).toBeNull();
    });

    it('throws when the organisation does not exist', async () => {
      await expect(
        service.upsertForEmployee(randomUUID(), { components: [] }, []),
      ).rejects.toThrow('Organisation not found');
    });
  });

  describe('upsertForSpoc', () => {
    it('allows the organisation SPOC to save the template', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();

      const saved = await service.upsertForSpoc(
        spoc.id,
        organisation.id,
        { heroCompanyName: 'Acme Corp', components: [] },
        [],
      );

      expect(saved.hero.companyName).toBe('Acme Corp');
    });

    it('rejects a non-SPOC member', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Regular member');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      await expect(
        service.upsertForSpoc(
          member.id,
          organisation.id,
          { components: [] },
          [],
        ),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });

    it('rejects a customer who does not belong to the organisation at all', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const outsider = await seedCustomer('Outsider');

      await expect(
        service.upsertForSpoc(
          outsider.id,
          organisation.id,
          { components: [] },
          [],
        ),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });
  });

  describe('deleteForEmployee', () => {
    it('removes the template entirely, reverting getByOrganisationId to null', async () => {
      const { organisation } = await seedOrgWithSpoc();
      await service.upsertForEmployee(
        organisation.id,
        { heroCompanyName: 'Acme Corp', components: [{ type: 'ABOUT' }] },
        [],
      );

      await service.deleteForEmployee(organisation.id);

      await expect(
        service.getByOrganisationId(organisation.id),
      ).resolves.toBeNull();
    });

    it('is a no-op when the organisation has no template yet', async () => {
      const { organisation } = await seedOrgWithSpoc();

      await expect(
        service.deleteForEmployee(organisation.id),
      ).resolves.toBeUndefined();
    });
  });

  describe('deleteForSpoc', () => {
    it('allows the organisation SPOC to delete the template', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      await service.upsertForSpoc(
        spoc.id,
        organisation.id,
        { heroCompanyName: 'Acme Corp', components: [] },
        [],
      );

      await service.deleteForSpoc(spoc.id, organisation.id);

      await expect(
        service.getByOrganisationId(organisation.id),
      ).resolves.toBeNull();
    });

    it('rejects a non-SPOC member', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Regular member');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      await expect(
        service.deleteForSpoc(member.id, organisation.id),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });
  });

  describe('getForMember', () => {
    it('allows any member (not just the SPOC) to read the template', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      await service.upsertForSpoc(
        spoc.id,
        organisation.id,
        { heroCompanyName: 'Acme Corp', components: [] },
        [],
      );
      const member = await seedCustomer('Regular member');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      const result = await service.getForMember(member.id, organisation.id);

      expect(result?.hero.companyName).toBe('Acme Corp');
    });

    it('rejects a customer who does not belong to the organisation', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const outsider = await seedCustomer('Outsider');

      await expect(
        service.getForMember(outsider.id, organisation.id),
      ).rejects.toThrow('Customer does not belong to this organisation');
    });
  });
});
