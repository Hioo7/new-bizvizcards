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
import { OrganisationMembersService } from '../../organisations/services/organisation-members.service';
import { OrganisationsService } from '../../organisations/services/organisations.service';
import { ECARD_MAX_PER_CUSTOMER } from '../ecards.constants';
import { EcardsService } from './ecards.service';

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

function makePdfFile(
  fieldname: string,
  content = 'fake-pdf-bytes',
): Express.Multer.File {
  return {
    fieldname,
    originalname: 'brochure.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from(content),
    size: content.length,
  } as Express.Multer.File;
}

describe('EcardsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let fakeProvider: FakeMediaStorageProvider;
  let mediaService: MediaService;
  let organisationsService: OrganisationsService;
  let organisationMembersService: OrganisationMembersService;
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
    const bootstrapRegistry: MediaStorageProviderRegistry = {
      [MediaSource.MINIO]: new FakeMediaStorageProvider(),
    };
    organisationsService = new OrganisationsService(
      prisma,
      new MediaService(prisma, bootstrapRegistry),
    );
    organisationMembersService = new OrganisationMembersService(
      prisma,
      organisationsService,
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
    service = new EcardsService(
      prisma,
      mediaService,
      organisationsService,
      organisationMembersService,
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
          heroName: 'Jane Doe (Personal)',
          heroEmail: 'jane.personal@example.com',
          heroCompanyName: 'Acme',
          organisationId: organisation.id,
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
            {
              type: 'WHATSAPP',
              phoneCountryDialCode: '91',
              phoneNumber: '9123456780',
            },
            {
              type: 'BROCHURE',
              pdf: { action: 'upload' },
            },
          ],
        },
        [
          makeFile('heroProfilePhoto'),
          makeFile('galleryImage_0_0'),
          makePdfFile('brochurePdf'),
        ],
      );

      expect(created.endpoint).toMatch(/^e2e-/);
      // Independently stored — not derived from the customer's account name.
      expect(created.hero.name).toBe('Jane Doe (Personal)');
      expect(created.hero.email).toBe('jane.personal@example.com');
      expect(created.hero.profilePhotoUrl).toContain('/media/test-bucket/');
      expect(created.components).toHaveLength(7);

      const brochure = created.components.find((c) => c.type === 'BROCHURE');
      expect(brochure).toMatchObject({
        fileName: 'brochure.pdf',
      });
      expect(brochure?.pdfUrl).toContain('/media/test-bucket/');

      const whatsapp = created.components.find((c) => c.type === 'WHATSAPP');
      expect(whatsapp).toMatchObject({
        phoneCountryDialCode: '91',
        phoneNumber: '9123456780',
      });

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

    it('allows a customer to own multiple, independently-identified e-cards', async () => {
      const customer = await seedCustomer('Jane Doe');
      const personal = await service.createForCustomer(
        customer.id,
        {
          endpoint: `personal-${randomUUID()}`,
          heroName: 'Jane Doe',
          heroEmail: 'jane@personal.example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );
      const branded = await service.createForCustomer(
        customer.id,
        {
          endpoint: `branded-${randomUUID()}`,
          heroName: 'Jane Doe',
          heroEmail: 'jane@acme.example.com',
          isExchangeContactEnabled: true,
          heroCompanyName: 'Acme Inc',
          components: [],
        },
        [],
      );

      expect(personal.id).not.toBe(branded.id);
      expect(personal.hero.email).toBe('jane@personal.example.com');
      expect(branded.hero.email).toBe('jane@acme.example.com');

      const listed = await service.listByCustomerId(customer.id);
      expect(listed.map((c) => c.id).sort()).toEqual(
        [personal.id, branded.id].sort(),
      );
    });

    it('rejects creating more than ECARD_MAX_PER_CUSTOMER e-cards', async () => {
      const customer = await seedCustomer();
      for (let i = 0; i < ECARD_MAX_PER_CUSTOMER; i++) {
        await service.createForCustomer(
          customer.id,
          {
            endpoint: `cap-${i}-${randomUUID()}`,
            heroName: 'Test Customer',
            heroEmail: 'test@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        );
      }

      await expect(
        service.createForCustomer(
          customer.id,
          {
            endpoint: `cap-over-${randomUUID()}`,
            heroName: 'Test Customer',
            heroEmail: 'test@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow(
        `This customer already has the maximum of ${ECARD_MAX_PER_CUSTOMER} e-cards`,
      );
    });

    it('rejects an endpoint already in use', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const endpoint = `dup-${randomUUID()}`;
      await service.createForCustomer(
        customerA.id,
        {
          endpoint,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      await expect(
        service.createForCustomer(
          customerB.id,
          {
            endpoint,
            heroName: 'Test Customer',
            heroEmail: 'test@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow('Endpoint already in use');
    });

    it('rejects a TEAM component when the card is not linked to an organisation', async () => {
      const customer = await seedCustomer();
      await expect(
        service.createForCustomer(
          customer.id,
          {
            endpoint: `no-org-${randomUUID()}`,
            heroName: 'Test Customer',
            heroEmail: 'test@example.com',
            isExchangeContactEnabled: true,
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
        'Cannot add team members: this card is not linked to an organisation yet',
      );
    });

    it('rejects a TEAM member from a different organisation than the card is linked to', async () => {
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
            heroName: 'Owner',
            heroEmail: 'owner@example.com',
            isExchangeContactEnabled: true,
            organisationId: ownOrg.id,
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
        "One or more team members do not belong to this card's organisation",
      );
    });

    it('rejects tagging a card to an organisation the customer does not belong to', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const outsider = await seedCustomer('Outsider');

      await expect(
        service.createForCustomer(
          outsider.id,
          {
            endpoint: `not-a-member-${randomUUID()}`,
            heroName: 'Outsider',
            heroEmail: 'outsider@example.com',
            isExchangeContactEnabled: true,
            organisationId: organisation.id,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow('Customer does not belong to this organisation');
    });

    it('resolves TEAM eligibility per-card when a customer belongs to two organisations', async () => {
      const { organisation: orgA } = await seedOrgWithSpoc();
      const { organisation: orgB } = await seedOrgWithSpoc();
      const owner = await seedCustomer('Owner');
      await prisma.organisationMember.create({
        data: { organisationId: orgA.id, customerId: owner.id },
      });
      await prisma.organisationMember.create({
        data: { organisationId: orgB.id, customerId: owner.id },
      });

      const memberOfA = await seedCustomer('Member of A');
      const membershipA = await prisma.organisationMember.create({
        data: { organisationId: orgA.id, customerId: memberOfA.id },
      });
      const memberOfB = await seedCustomer('Member of B');
      const membershipB = await prisma.organisationMember.create({
        data: { organisationId: orgB.id, customerId: memberOfB.id },
      });

      const cardForA = await service.createForCustomer(
        owner.id,
        {
          endpoint: `card-a-${randomUUID()}`,
          heroName: 'Owner',
          heroEmail: 'owner@example.com',
          isExchangeContactEnabled: true,
          organisationId: orgA.id,
          components: [
            {
              type: 'TEAM',
              members: [{ organisationMemberId: membershipA.id }],
            },
          ],
        },
        [],
      );
      const team = cardForA.components.find((c) => c.type === 'TEAM');
      expect(team?.members).toEqual([
        expect.objectContaining({ organisationMemberId: membershipA.id }),
      ]);

      const cardForB = await service.createForCustomer(
        owner.id,
        {
          endpoint: `card-b-valid-${randomUUID()}`,
          heroName: 'Owner',
          heroEmail: 'owner@example.com',
          isExchangeContactEnabled: true,
          organisationId: orgB.id,
          components: [
            {
              type: 'TEAM',
              members: [{ organisationMemberId: membershipB.id }],
            },
          ],
        },
        [],
      );
      const teamB = cardForB.components.find((c) => c.type === 'TEAM');
      expect(teamB?.members).toEqual([
        expect.objectContaining({ organisationMemberId: membershipB.id }),
      ]);

      await expect(
        service.updateById(
          cardForB.id,
          {
            endpoint: cardForB.endpoint,
            heroName: 'Owner',
            heroEmail: 'owner@example.com',
            isExchangeContactEnabled: true,
            organisationId: orgB.id,
            components: [
              {
                type: 'TEAM',
                // membershipA belongs to orgA, not orgB — cardForB is
                // tagged to orgB, so this should be rejected.
                members: [{ organisationMemberId: membershipA.id }],
              },
            ],
          },
          [],
        ),
      ).rejects.toThrow(
        "One or more team members do not belong to this card's organisation",
      );
    });

    describe('organisationId', () => {
      it("accepts a card tagged to the customer's organisation", async () => {
        const { organisation } = await seedOrgWithSpoc();
        const customer = await seedCustomer('Jane Doe');
        await prisma.organisationMember.create({
          data: { organisationId: organisation.id, customerId: customer.id },
        });

        const created = await service.createForCustomer(
          customer.id,
          {
            endpoint: `org-card-${randomUUID()}`,
            heroName: 'Jane Doe',
            heroEmail: 'jane@acme.example.com',
            isExchangeContactEnabled: true,
            organisationId: organisation.id,
            components: [],
          },
          [],
        );

        expect(created.organisationId).toBe(organisation.id);
      });

      it('rejects a second card for the same customer+organisation pair', async () => {
        const { organisation } = await seedOrgWithSpoc();
        const customer = await seedCustomer('Jane Doe');
        await prisma.organisationMember.create({
          data: { organisationId: organisation.id, customerId: customer.id },
        });
        await service.createForCustomer(
          customer.id,
          {
            endpoint: `org-first-${randomUUID()}`,
            heroName: 'Jane Doe',
            heroEmail: 'jane@acme.example.com',
            isExchangeContactEnabled: true,
            organisationId: organisation.id,
            components: [],
          },
          [],
        );

        await expect(
          service.createForCustomer(
            customer.id,
            {
              endpoint: `org-second-${randomUUID()}`,
              heroName: 'Jane Doe',
              heroEmail: 'jane@acme.example.com',
              isExchangeContactEnabled: true,
              organisationId: organisation.id,
              components: [],
            },
            [],
          ),
        ).rejects.toThrow(
          'This customer already has an e-card for this organisation',
        );
      });

      it('rejects an organisationId that does not reference an existing organisation', async () => {
        const customer = await seedCustomer();

        await expect(
          service.createForCustomer(
            customer.id,
            {
              endpoint: `org-missing-${randomUUID()}`,
              heroName: 'Test Customer',
              heroEmail: 'test@example.com',
              isExchangeContactEnabled: true,
              organisationId: randomUUID(),
              components: [],
            },
            [],
          ),
        ).rejects.toThrow(
          'organisationId does not reference an existing organisation',
        );
      });
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
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
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
            heroName: 'Test Customer',
            heroEmail: 'test@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow('customerId does not reference an existing customer');
    });
  });

  describe('listByCustomerId', () => {
    it('returns an empty array when the customer has no e-cards', async () => {
      const customer = await seedCustomer();
      await expect(service.listByCustomerId(customer.id)).resolves.toEqual([]);
    });
  });

  describe('team member resolution via organisationId', () => {
    it("resolves a colleague's org-tagged card for phone/endpoint, omitting them if untagged", async () => {
      const { organisation } = await seedOrgWithSpoc();
      const owner = await seedCustomer('Owner');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: owner.id },
      });
      const ownerCard = await service.createForCustomer(
        owner.id,
        {
          endpoint: `owner-${randomUUID()}`,
          heroName: 'Owner',
          heroEmail: 'owner@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: [],
        },
        [],
      );

      const taggedMember = await seedCustomer('Tagged Mate');
      const taggedMembership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: taggedMember.id },
      });
      await service.createForCustomer(
        taggedMember.id,
        {
          endpoint: `tagged-${randomUUID()}`,
          heroName: 'Tagged Mate',
          heroEmail: 'tagged@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          phoneCountryDialCode: '91',
          phoneNumber: '9111111111',
          components: [],
        },
        [],
      );

      const untaggedMember = await seedCustomer('Untagged Mate');
      const untaggedMembership = await prisma.organisationMember.create({
        data: {
          organisationId: organisation.id,
          customerId: untaggedMember.id,
        },
      });
      await service.createForCustomer(
        untaggedMember.id,
        {
          endpoint: `untagged-${randomUUID()}`,
          heroName: 'Untagged Mate',
          heroEmail: 'untagged@example.com',
          isExchangeContactEnabled: true,
          phoneCountryDialCode: '91',
          phoneNumber: '9222222222',
          components: [],
        },
        [],
      );

      const updated = await service.updateById(
        ownerCard.id,
        {
          endpoint: ownerCard.endpoint,
          heroName: ownerCard.hero.name,
          heroEmail: ownerCard.hero.email,
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: [
            {
              type: 'TEAM',
              members: [
                { organisationMemberId: taggedMembership.id },
                { organisationMemberId: untaggedMembership.id },
              ],
            },
          ],
        },
        [],
      );

      const team = updated.components.find((c) => c.type === 'TEAM');
      const taggedResult = team?.members.find(
        (m) => m.organisationMemberId === taggedMembership.id,
      );
      const untaggedResult = team?.members.find(
        (m) => m.organisationMemberId === untaggedMembership.id,
      );
      expect(taggedResult).toMatchObject({
        phoneCountryDialCode: '91',
        phoneNumber: '9111111111',
      });
      expect(taggedResult?.ecardEndpoint).toMatch(/^tagged-/);
      expect(untaggedResult).toMatchObject({
        phoneCountryDialCode: null,
        phoneNumber: null,
        ecardEndpoint: null,
      });
    });
  });

  describe('updateById (full replace)', () => {
    it('replaces components, keeps an existing gallery image, and orphans the replaced hero photo', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `upd-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
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
      const keptMediaId = createdGallery?.subGalleries[0].images[0]
        .imageMediaId as string;

      const updated = await service.updateById(
        created.id,
        {
          endpoint: created.endpoint,
          heroName: 'Updated Name',
          heroEmail: 'updated@example.com',
          isExchangeContactEnabled: true,
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
                  images: [{ action: 'keep', mediaId: keptMediaId }],
                },
              ],
            },
          ],
        },
        [makeFile('heroProfilePhoto')],
      );

      expect(updated.hero.name).toBe('Updated Name');
      expect(updated.hero.email).toBe('updated@example.com');
      expect(updated.components).toHaveLength(2);
      expect(updated.components[0]).toMatchObject({
        type: 'ABOUT',
        profession: 'Updated Profession',
      });
      const updatedGallery = updated.components.find(
        (c) => c.type === 'GALLERY',
      );
      expect(updatedGallery?.subGalleries[0].images[0].imageMediaId).toBe(
        keptMediaId,
      );
      expect(updated.hero.profilePhotoMediaId).not.toBe(originalHeroMediaId);
      expect(fakeProvider.deletedKeys.length).toBeGreaterThan(0);

      // the replaced hero photo's Media row is gone
      await expect(
        prisma.media.findUnique({ where: { id: originalHeroMediaId } }),
      ).resolves.toBeNull();
      // the kept gallery image's row survives
      await expect(
        prisma.media.findUnique({ where: { id: keptMediaId } }),
      ).resolves.not.toBeNull();
    });

    it('keeps the same brochure PDF on update when the slot action is "keep"', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `brochure-keep-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [{ type: 'BROCHURE', pdf: { action: 'upload' } }],
        },
        [makePdfFile('brochurePdf')],
      );
      const brochureMediaId = created.components.find(
        (c) => c.type === 'BROCHURE',
      )?.pdfMediaId as string;

      const updated = await service.updateById(
        created.id,
        {
          endpoint: created.endpoint,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'BROCHURE',
              pdf: { action: 'keep', mediaId: brochureMediaId },
            },
          ],
        },
        [],
      );

      const updatedBrochure = updated.components.find(
        (c) => c.type === 'BROCHURE',
      );
      expect(updatedBrochure?.pdfMediaId).toBe(brochureMediaId);
      expect(fakeProvider.deletedKeys).toHaveLength(0);
    });

    it('replaces the brochure PDF on update and orphans the old one', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `brochure-replace-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [{ type: 'BROCHURE', pdf: { action: 'upload' } }],
        },
        [makePdfFile('brochurePdf')],
      );
      const originalMediaId = created.components.find(
        (c) => c.type === 'BROCHURE',
      )?.pdfMediaId as string;

      const updated = await service.updateById(
        created.id,
        {
          endpoint: created.endpoint,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [{ type: 'BROCHURE', pdf: { action: 'upload' } }],
        },
        [makePdfFile('brochurePdf')],
      );

      const updatedMediaId = updated.components.find(
        (c) => c.type === 'BROCHURE',
      )?.pdfMediaId;
      expect(updatedMediaId).not.toBe(originalMediaId);
      await expect(
        prisma.media.findUnique({ where: { id: originalMediaId } }),
      ).resolves.toBeNull();
    });

    it('rejects a BROCHURE upload slot whose file is missing from the request', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `brochure-missing-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      await expect(
        service.updateById(
          created.id,
          {
            endpoint: created.endpoint,
            heroName: 'Test Customer',
            heroEmail: 'test@example.com',
            isExchangeContactEnabled: true,
            components: [{ type: 'BROCHURE', pdf: { action: 'upload' } }],
          },
          [],
        ),
      ).rejects.toThrow('Missing uploaded file for field "brochurePdf"');
    });

    it('rejects a "keep" slot referencing a mediaId that does not belong to this card', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `keep-bad-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      await expect(
        service.updateById(
          created.id,
          {
            endpoint: created.endpoint,
            heroName: 'Test Customer',
            heroEmail: 'test@example.com',
            isExchangeContactEnabled: true,
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

    it('throws when the id does not reference an existing e-card', async () => {
      await expect(
        service.updateById(
          randomUUID(),
          {
            endpoint: `none-${randomUUID()}`,
            heroName: 'Test Customer',
            heroEmail: 'test@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow('E-card not found');
    });
  });

  describe('removeById', () => {
    it('deletes the card and its media', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `rm-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          heroProfilePhoto: { action: 'upload' },
          components: [],
        },
        [makeFile('heroProfilePhoto')],
      );
      const mediaId = created.hero.profilePhotoMediaId as string;

      await service.removeById(created.id);

      await expect(
        prisma.eCard.findUnique({ where: { id: created.id } }),
      ).resolves.toBeNull();
      await expect(
        prisma.media.findUnique({ where: { id: mediaId } }),
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
        {
          endpoint: `list-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
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

  describe('createForOrganisationSpoc', () => {
    it('lets the SPOC create a card for a member who has none yet', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      const created = await service.createForOrganisationSpoc(
        spoc.id,
        organisation.id,
        {
          memberId: membership.id,
          endpoint: `spoc-create-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      expect(created.customerId).toBe(member.id);
      expect(created.organisationId).toBe(organisation.id);
      expect(created.createdByEmployeeId).toBeNull();
    });

    it('rejects a caller who is a MEMBER, not the SPOC', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const actingMember = await seedCustomer('Acting Member');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: actingMember.id },
      });
      const target = await seedCustomer('Target');
      const targetMembership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: target.id },
      });

      await expect(
        service.createForOrganisationSpoc(
          actingMember.id,
          organisation.id,
          {
            memberId: targetMembership.id,
            endpoint: `spoc-create-${randomUUID()}`,
            heroName: 'Target',
            heroEmail: 'target@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });

    it('rejects a caller who does not belong to the organisation at all', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const outsider = await seedCustomer('Outsider');
      const target = await seedCustomer('Target');
      const targetMembership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: target.id },
      });

      await expect(
        service.createForOrganisationSpoc(
          outsider.id,
          organisation.id,
          {
            memberId: targetMembership.id,
            endpoint: `spoc-create-${randomUUID()}`,
            heroName: 'Target',
            heroEmail: 'target@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });

    it('rejects a memberId that belongs to a different organisation', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const { organisation: otherOrg } = await seedOrgWithSpoc();
      const outsider = await seedCustomer('Outsider');
      const outsiderMembership = await prisma.organisationMember.create({
        data: { organisationId: otherOrg.id, customerId: outsider.id },
      });

      await expect(
        service.createForOrganisationSpoc(
          spoc.id,
          organisation.id,
          {
            memberId: outsiderMembership.id,
            endpoint: `spoc-create-${randomUUID()}`,
            heroName: 'Outsider',
            heroEmail: 'outsider@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow('Organisation member not found');
    });

    it('rejects when the target member already has a card for this organisation', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      await service.createForOrganisationSpoc(
        spoc.id,
        organisation.id,
        {
          memberId: membership.id,
          endpoint: `spoc-create-first-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      await expect(
        service.createForOrganisationSpoc(
          spoc.id,
          organisation.id,
          {
            memberId: membership.id,
            endpoint: `spoc-create-second-${randomUUID()}`,
            heroName: 'Member One',
            heroEmail: 'member-one@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow(
        'This customer already has an e-card for this organisation',
      );
    });
  });

  describe('updateForOrganisationSpoc', () => {
    it('lets the SPOC edit a card originally created by the member themself', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const created = await service.createForCustomer(
        member.id,
        {
          endpoint: `member-owned-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: [],
        },
        [],
      );

      const updated = await service.updateForOrganisationSpoc(
        spoc.id,
        organisation.id,
        created.id,
        {
          endpoint: created.endpoint,
          heroName: 'Updated By SPOC',
          heroEmail: 'updated@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      expect(updated.hero.name).toBe('Updated By SPOC');
      expect(updated.organisationId).toBe(organisation.id);
    });

    it('lets the SPOC edit a card originally created by another SPOC on behalf of the member', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const created = await service.createForOrganisationSpoc(
        spoc.id,
        organisation.id,
        {
          memberId: membership.id,
          endpoint: `spoc-owned-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      const updated = await service.updateForOrganisationSpoc(
        spoc.id,
        organisation.id,
        created.id,
        {
          endpoint: created.endpoint,
          heroName: 'Updated Again',
          heroEmail: 'updated-again@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      expect(updated.hero.name).toBe('Updated Again');
    });

    it('rejects a caller who is not the SPOC', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const created = await service.createForCustomer(
        member.id,
        {
          endpoint: `not-spoc-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: [],
        },
        [],
      );

      await expect(
        service.updateForOrganisationSpoc(
          member.id,
          organisation.id,
          created.id,
          {
            endpoint: created.endpoint,
            heroName: 'Should Not Update',
            heroEmail: 'member-one@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });

    it('404s when the card is linked to a different organisation', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const { organisation: otherOrg } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: otherOrg.id, customerId: member.id },
      });
      const created = await service.createForCustomer(
        member.id,
        {
          endpoint: `other-org-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          organisationId: otherOrg.id,
          components: [],
        },
        [],
      );

      await expect(
        service.updateForOrganisationSpoc(
          spoc.id,
          organisation.id,
          created.id,
          {
            endpoint: created.endpoint,
            heroName: 'Should Not Update',
            heroEmail: 'member-one@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow('E-card not found');
    });

    it('404s when the card has no organisation link at all', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const created = await service.createForCustomer(
        member.id,
        {
          endpoint: `personal-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      await expect(
        service.updateForOrganisationSpoc(
          spoc.id,
          organisation.id,
          created.id,
          {
            endpoint: created.endpoint,
            heroName: 'Should Not Update',
            heroEmail: 'member-one@example.com',
            isExchangeContactEnabled: true,
            components: [],
          },
          [],
        ),
      ).rejects.toThrow('E-card not found');
    });

    it('ignores a body-supplied organisationId and keeps the card linked to the route organisation', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const { organisation: otherOrg } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const created = await service.createForCustomer(
        member.id,
        {
          endpoint: `no-relink-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: [],
        },
        [],
      );

      const updated = await service.updateForOrganisationSpoc(
        spoc.id,
        organisation.id,
        created.id,
        {
          endpoint: created.endpoint,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          organisationId: otherOrg.id,
          components: [],
        },
        [],
      );

      expect(updated.organisationId).toBe(organisation.id);
    });
  });

  describe('getForOrganisationSpoc', () => {
    it("returns the card when it's linked to the SPOC's organisation", async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const created = await service.createForCustomer(
        member.id,
        {
          endpoint: `analytics-target-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: [],
        },
        [],
      );

      const found = await service.getForOrganisationSpoc(
        spoc.id,
        organisation.id,
        created.id,
      );
      expect(found.id).toBe(created.id);
    });

    it('rejects a caller who is not the SPOC', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const created = await service.createForCustomer(
        member.id,
        {
          endpoint: `analytics-forbidden-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: [],
        },
        [],
      );

      await expect(
        service.getForOrganisationSpoc(member.id, organisation.id, created.id),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });

    it('404s when the card belongs to a different organisation', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const { organisation: otherOrg } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: otherOrg.id, customerId: member.id },
      });
      const created = await service.createForCustomer(
        member.id,
        {
          endpoint: `analytics-wrong-org-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          organisationId: otherOrg.id,
          components: [],
        },
        [],
      );

      await expect(
        service.getForOrganisationSpoc(spoc.id, organisation.id, created.id),
      ).rejects.toThrow('E-card not found');
    });
  });

  describe('listForOrganisationSpoc', () => {
    it('returns only cards linked to the given organisation', async () => {
      const { spoc, organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const linked = await service.createForCustomer(
        member.id,
        {
          endpoint: `list-linked-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: [],
        },
        [],
      );
      await service.createForCustomer(
        member.id,
        {
          endpoint: `list-unlinked-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      const result = await service.listForOrganisationSpoc(
        spoc.id,
        organisation.id,
        { page: 1, pageSize: 20 },
      );

      expect(result.ecards.map((c) => c.id)).toEqual([linked.id]);
    });

    it('rejects a caller who is not the SPOC', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      await expect(
        service.listForOrganisationSpoc(member.id, organisation.id, {
          page: 1,
          pageSize: 20,
        }),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });
  });

  describe('linkEcardForEmployee', () => {
    it("links one of the member's unlinked cards to the organisation", async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const card = await service.createForCustomer(
        member.id,
        {
          endpoint: `unlinked-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      const linked = await service.linkEcardForEmployee(
        organisation.id,
        membership.id,
        card.id,
      );

      expect(linked.organisationId).toBe(organisation.id);
    });

    it('switches the link: unlinks the previously-linked card and links the new one', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const oldCard = await service.createForCustomer(
        member.id,
        {
          endpoint: `old-card-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: [],
        },
        [],
      );
      const newCard = await service.createForCustomer(
        member.id,
        {
          endpoint: `new-card-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      await service.linkEcardForEmployee(
        organisation.id,
        membership.id,
        newCard.id,
      );

      const refreshedOld = await service.getById(oldCard.id);
      const refreshedNew = await service.getById(newCard.id);
      expect(refreshedOld.organisationId).toBeNull();
      expect(refreshedNew.organisationId).toBe(organisation.id);
    });

    it('is idempotent when re-linking the already-linked card', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const card = await service.createForCustomer(
        member.id,
        {
          endpoint: `already-linked-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: [],
        },
        [],
      );

      await expect(
        service.linkEcardForEmployee(organisation.id, membership.id, card.id),
      ).resolves.toMatchObject({ organisationId: organisation.id });
    });

    it("rejects an e-card that doesn't belong to the selected member", async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });
      const someoneElse = await seedCustomer('Someone Else');
      const someoneElsesCard = await service.createForCustomer(
        someoneElse.id,
        {
          endpoint: `not-yours-${randomUUID()}`,
          heroName: 'Someone Else',
          heroEmail: 'someone-else@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      await expect(
        service.linkEcardForEmployee(
          organisation.id,
          membership.id,
          someoneElsesCard.id,
        ),
      ).rejects.toThrow('This e-card does not belong to the selected member');
    });

    it('throws when the member does not belong to this organisation', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const card = await service.createForCustomer(
        member.id,
        {
          endpoint: `no-membership-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          components: [],
        },
        [],
      );

      await expect(
        service.linkEcardForEmployee(organisation.id, randomUUID(), card.id),
      ).rejects.toThrow('Organisation member not found');
    });

    it('throws when the e-card does not exist', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const member = await seedCustomer('Member One');
      const membership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      await expect(
        service.linkEcardForEmployee(
          organisation.id,
          membership.id,
          randomUUID(),
        ),
      ).rejects.toThrow('E-card not found');
    });
  });
});
