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
import { OrganisationMembersService } from '../../organisations/services/organisation-members.service';
import { OrganisationsService } from '../../organisations/services/organisations.service';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { ecardSocialLinksComponentSchema } from '../dto/components/social-links.dto';
import type {
  CreateEcardAsEmployeeDto,
  CreateEcardDto,
} from '../dto/create-ecard.dto';
import type { CreateEcardAsSpocDto } from '../dto/create-ecard-as-spoc.dto';
import type { UpdateEcardDto } from '../dto/update-ecard.dto';
import { ECARD_MAX_PER_CUSTOMER } from '../ecards.constants';
import { EcardsService } from './ecards.service';

const EMPTY_COMPONENTS: CreateEcardDto['components'] = [];

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

  download(key: string): Promise<Buffer> {
    void key;
    return Promise.resolve(Buffer.alloc(0));
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
  let planEnforcementService: PlanEnforcementService;
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
    planEnforcementService = new PlanEnforcementService(
      prisma,
      new PlanPolicyResolverService(prisma),
    );
    organisationsService = new OrganisationsService(
      prisma,
      new MediaService(prisma, bootstrapRegistry),
      planEnforcementService,
    );
    organisationMembersService = new OrganisationMembersService(
      prisma,
      organisationsService,
      planEnforcementService,
      new MediaService(prisma, bootstrapRegistry),
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
      new MediaSlotResolverService(mediaService),
      organisationsService,
      organisationMembersService,
      planEnforcementService,
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
      // Team members must have an e-card linked to the shared organisation to
      // be eligible for the TEAM component (assertTeamMembersEligible).
      await service.createForCustomer(
        member.id,
        {
          endpoint: `team-mate-${randomUUID()}`,
          heroName: 'Team Mate',
          heroEmail: 'team-mate@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
        [],
      );

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
                  images: [{ image: { action: 'upload' } }],
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
        } as unknown as CreateEcardDto,
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

    it('creates an e-card with a VIDEO_GALLERY component, preserving sub-gallery and video order, with and without captions', async () => {
      const customer = await seedCustomer();

      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `video-gallery-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'VIDEO_GALLERY',
              subGalleries: [
                {
                  title: 'Launch Event',
                  videos: [
                    {
                      videoUrl: 'https://www.youtube.com/embed/abc123',
                      caption: 'Opening keynote',
                    },
                    { videoUrl: 'https://player.vimeo.com/video/76979871' },
                  ],
                },
                {
                  title: 'Behind the Scenes',
                  videos: [
                    {
                      videoUrl: 'https://www.youtube.com/embed/xyz789',
                      caption: 'Setup day',
                    },
                  ],
                },
              ],
            },
          ],
        } as unknown as CreateEcardDto,
        [],
      );

      const videoGallery = created.components.find(
        (c) => c.type === 'VIDEO_GALLERY',
      );
      expect(videoGallery?.subGalleries).toHaveLength(2);
      expect(videoGallery?.subGalleries.map((sg) => sg.title)).toEqual([
        'Launch Event',
        'Behind the Scenes',
      ]);
      expect(videoGallery?.subGalleries[0].videos).toEqual([
        {
          videoUrl: 'https://www.youtube.com/embed/abc123',
          caption: 'Opening keynote',
        },
        { videoUrl: 'https://player.vimeo.com/video/76979871', caption: null },
      ]);
      expect(videoGallery?.subGalleries[1].videos).toEqual([
        {
          videoUrl: 'https://www.youtube.com/embed/xyz789',
          caption: 'Setup day',
        },
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardDto,
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
          } as unknown as CreateEcardDto,
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
          } as unknown as CreateEcardDto,
          [],
        ),
      ).rejects.toThrow(
        "One or more team members do not belong to this card's organisation",
      );
    });

    it('rejects a TEAM member who belongs to the organisation but has no e-card linked to it', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const owner = await seedCustomer('Owner');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: owner.id },
      });

      const noCardMember = await seedCustomer('No Card Mate');
      const noCardMembership = await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: noCardMember.id },
      });

      await expect(
        service.createForCustomer(
          owner.id,
          {
            endpoint: `no-ecard-${randomUUID()}`,
            heroName: 'Owner',
            heroEmail: 'owner@example.com',
            isExchangeContactEnabled: true,
            organisationId: organisation.id,
            components: [
              {
                type: 'TEAM',
                members: [{ organisationMemberId: noCardMembership.id }],
              },
            ],
          } as unknown as CreateEcardDto,
          [],
        ),
      ).rejects.toThrow(
        'One or more team members do not have an e-card linked to this organisation',
      );
    });

    it('accepts a TEAM member who has an e-card linked to the shared organisation', async () => {
      const { organisation } = await seedOrgWithSpoc();
      const owner = await seedCustomer('Owner');
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: owner.id },
      });

      const eligibleMember = await seedCustomer('Eligible Mate');
      const eligibleMembership = await prisma.organisationMember.create({
        data: {
          organisationId: organisation.id,
          customerId: eligibleMember.id,
        },
      });
      await service.createForCustomer(
        eligibleMember.id,
        {
          endpoint: `eligible-${randomUUID()}`,
          heroName: 'Eligible Mate',
          heroEmail: 'eligible@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          heroProfilePhoto: { action: 'upload' },
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
        [makeFile('heroProfilePhoto')],
      );

      const created = await service.createForCustomer(
        owner.id,
        {
          endpoint: `has-ecard-${randomUUID()}`,
          heroName: 'Owner',
          heroEmail: 'owner@example.com',
          isExchangeContactEnabled: true,
          organisationId: organisation.id,
          components: [
            {
              type: 'TEAM',
              members: [{ organisationMemberId: eligibleMembership.id }],
            },
          ],
        } as unknown as CreateEcardDto,
        [],
      );

      const team = created.components.find((c) => c.type === 'TEAM');
      expect(team?.members).toEqual([
        expect.objectContaining({
          organisationMemberId: eligibleMembership.id,
        }),
      ]);
      // The avatar comes from the linked e-card's own hero photo, not any
      // account-level profile picture.
      expect(team?.members[0]?.photoUrl).toContain('/media/test-bucket/');
      expect(team?.members[0]?.ecardEndpoint).toMatch(/^eligible-/);
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
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardDto,
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
      await service.createForCustomer(
        memberOfA.id,
        {
          endpoint: `member-of-a-${randomUUID()}`,
          heroName: 'Member of A',
          heroEmail: 'member-of-a@example.com',
          isExchangeContactEnabled: true,
          organisationId: orgA.id,
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
        [],
      );
      const memberOfB = await seedCustomer('Member of B');
      const membershipB = await prisma.organisationMember.create({
        data: { organisationId: orgB.id, customerId: memberOfB.id },
      });
      await service.createForCustomer(
        memberOfB.id,
        {
          endpoint: `member-of-b-${randomUUID()}`,
          heroName: 'Member of B',
          heroEmail: 'member-of-b@example.com',
          isExchangeContactEnabled: true,
          organisationId: orgB.id,
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
        [],
      );

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
        } as unknown as CreateEcardDto,
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
        } as unknown as CreateEcardDto,
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
          } as unknown as UpdateEcardDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardDto,
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
              components: EMPTY_COMPONENTS,
            } as unknown as CreateEcardDto,
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
              components: EMPTY_COMPONENTS,
            } as unknown as CreateEcardDto,
            [],
          ),
        ).rejects.toThrow(
          'organisationId does not reference an existing organisation',
        );
      });
    });

    describe('autoDownloadContact', () => {
      it('persists an explicit true value', async () => {
        const customer = await seedCustomer();
        const created = await service.createForCustomer(
          customer.id,
          {
            endpoint: `auto-download-${randomUUID()}`,
            heroName: 'Test Customer',
            heroEmail: 'test@example.com',
            isExchangeContactEnabled: true,
            autoDownloadContact: true,
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardDto,
          [],
        );

        expect(created.hero.autoDownloadContact).toBe(true);
      });

      it('defaults to false when omitted', async () => {
        const customer = await seedCustomer();
        const created = await service.createForCustomer(
          customer.id,
          {
            endpoint: `auto-download-default-${randomUUID()}`,
            heroName: 'Test Customer',
            heroEmail: 'test@example.com',
            isExchangeContactEnabled: true,
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardDto,
          [],
        );

        expect(created.hero.autoDownloadContact).toBe(false);
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardAsEmployeeDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardAsEmployeeDto,
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
    it("resolves a colleague's org-tagged card for phone/endpoint, and rejects a colleague whose card isn't tagged to the shared organisation", async () => {
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
              members: [{ organisationMemberId: taggedMembership.id }],
            },
          ],
        } as unknown as UpdateEcardDto,
        [],
      );

      const team = updated.components.find((c) => c.type === 'TEAM');
      const taggedResult = team?.members.find(
        (m) => m.organisationMemberId === taggedMembership.id,
      );
      expect(taggedResult).toMatchObject({
        phoneCountryDialCode: '91',
        phoneNumber: '9111111111',
      });
      expect(taggedResult?.ecardEndpoint).toMatch(/^tagged-/);

      // Untagged Mate has an e-card, but it isn't linked to this
      // organisation — assertTeamMembersEligible must reject them.
      await expect(
        service.updateById(
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
                members: [{ organisationMemberId: untaggedMembership.id }],
              },
            ],
          } as unknown as UpdateEcardDto,
          [],
        ),
      ).rejects.toThrow(
        'One or more team members do not have an e-card linked to this organisation',
      );
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
              subGalleries: [{ images: [{ image: { action: 'upload' } }] }],
            },
          ],
        } as unknown as CreateEcardDto,
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
                  images: [{ image: { action: 'keep', mediaId: keptMediaId } }],
                },
              ],
            },
          ],
        } as unknown as UpdateEcardDto,
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

    it('round-trips a GALLERY image caption through create and update, and clears it back to null when omitted', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `gallery-caption-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'GALLERY',
              subGalleries: [
                {
                  images: [
                    { image: { action: 'upload' }, caption: 'Team outing' },
                    { image: { action: 'upload' } },
                  ],
                },
              ],
            },
          ],
        } as unknown as CreateEcardDto,
        [makeFile('galleryImage_0_0'), makeFile('galleryImage_0_1')],
      );

      const createdGallery = created.components.find(
        (c) => c.type === 'GALLERY',
      );
      expect(createdGallery?.subGalleries[0].images[0].caption).toBe(
        'Team outing',
      );
      expect(createdGallery?.subGalleries[0].images[1].caption).toBeNull();

      const mediaId0 = createdGallery?.subGalleries[0].images[0]
        .imageMediaId as string;
      const mediaId1 = createdGallery?.subGalleries[0].images[1]
        .imageMediaId as string;

      const updated = await service.updateById(
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
                {
                  images: [
                    {
                      image: { action: 'keep', mediaId: mediaId0 },
                      caption: 'Updated caption',
                    },
                    { image: { action: 'keep', mediaId: mediaId1 } },
                  ],
                },
              ],
            },
          ],
        } as unknown as UpdateEcardDto,
        [],
      );

      const updatedGallery = updated.components.find(
        (c) => c.type === 'GALLERY',
      );
      expect(updatedGallery?.subGalleries[0].images[0].caption).toBe(
        'Updated caption',
      );
      expect(updatedGallery?.subGalleries[0].images[1].caption).toBeNull();

      // Omitting a previously-set caption on a later full-replace clears it,
      // not "leaves it unchanged" — same convention as every other optional
      // component field.
      const cleared = await service.updateById(
        updated.id,
        {
          endpoint: updated.endpoint,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'GALLERY',
              subGalleries: [
                {
                  images: [{ image: { action: 'keep', mediaId: mediaId0 } }],
                },
              ],
            },
          ],
        } as unknown as UpdateEcardDto,
        [],
      );

      const clearedGallery = cleared.components.find(
        (c) => c.type === 'GALLERY',
      );
      expect(clearedGallery?.subGalleries[0].images[0].caption).toBeNull();
    });

    it('replaces VIDEO_GALLERY sub-galleries and videos wholesale on update', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `video-gallery-upd-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'VIDEO_GALLERY',
              subGalleries: [
                {
                  title: 'Old Gallery',
                  videos: [
                    { videoUrl: 'https://www.youtube.com/embed/old111' },
                  ],
                },
              ],
            },
          ],
        } as unknown as CreateEcardDto,
        [],
      );

      const updated = await service.updateById(
        created.id,
        {
          endpoint: created.endpoint,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'VIDEO_GALLERY',
              subGalleries: [
                {
                  title: 'New Gallery',
                  videos: [
                    {
                      videoUrl: 'https://player.vimeo.com/video/222222',
                      caption: 'Fresh footage',
                    },
                  ],
                },
              ],
            },
          ],
        } as unknown as UpdateEcardDto,
        [],
      );

      const videoGallery = updated.components.find(
        (c) => c.type === 'VIDEO_GALLERY',
      );
      expect(videoGallery?.subGalleries).toHaveLength(1);
      expect(videoGallery?.subGalleries[0].title).toBe('New Gallery');
      expect(videoGallery?.subGalleries[0].videos).toEqual([
        {
          videoUrl: 'https://player.vimeo.com/video/222222',
          caption: 'Fresh footage',
        },
      ]);
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
        } as unknown as CreateEcardDto,
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
        } as unknown as UpdateEcardDto,
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
        } as unknown as CreateEcardDto,
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
        } as unknown as UpdateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          } as unknown as UpdateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
                  {
                    images: [
                      { image: { action: 'keep', mediaId: randomUUID() } },
                    ],
                  },
                ],
              },
            ],
          } as unknown as UpdateEcardDto,
          [],
        ),
      ).rejects.toThrow('mediaId does not belong to this resource');
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
            components: EMPTY_COMPONENTS,
          } as unknown as UpdateEcardDto,
          [],
        ),
      ).rejects.toThrow('E-card not found');
    });

    it('round-trips autoDownloadContact through true and back to false', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `auto-download-upd-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          autoDownloadContact: false,
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
        [],
      );
      expect(created.hero.autoDownloadContact).toBe(false);

      const enabled = await service.updateById(
        created.id,
        {
          endpoint: created.endpoint,
          heroName: created.hero.name,
          heroEmail: created.hero.email,
          isExchangeContactEnabled: true,
          autoDownloadContact: true,
          components: EMPTY_COMPONENTS,
        } as unknown as UpdateEcardDto,
        [],
      );
      expect(enabled.hero.autoDownloadContact).toBe(true);

      const disabled = await service.updateById(
        created.id,
        {
          endpoint: created.endpoint,
          heroName: created.hero.name,
          heroEmail: created.hero.email,
          isExchangeContactEnabled: true,
          autoDownloadContact: false,
          components: EMPTY_COMPONENTS,
        } as unknown as UpdateEcardDto,
        [],
      );
      expect(disabled.hero.autoDownloadContact).toBe(false);
    });
  });

  describe('LOCATION_TILE / REVIEW_LINK / TESTIMONIALS components', () => {
    it('creates an e-card with all three new component types and resolves the response', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `new-components-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'LOCATION_TILE',
              label: 'Head Office',
              latitude: 12.9716,
              longitude: 77.5946,
            },
            { type: 'REVIEW_LINK', url: 'https://g.page/r/example/review' },
            {
              type: 'TESTIMONIALS',
              entries: [
                { name: 'Alice', rating: 5, text: 'Great service!' },
                { name: 'Bob', rating: 4, text: 'Very good.' },
              ],
            },
          ],
        } as unknown as CreateEcardDto,
        [],
      );

      expect(created.components).toHaveLength(3);

      const locationTile = created.components.find(
        (c) => c.type === 'LOCATION_TILE',
      );
      expect(locationTile).toMatchObject({
        label: 'Head Office',
        latitude: 12.9716,
        longitude: 77.5946,
      });

      const reviewLink = created.components.find(
        (c) => c.type === 'REVIEW_LINK',
      );
      expect(reviewLink).toMatchObject({
        url: 'https://g.page/r/example/review',
      });

      const testimonials = created.components.find(
        (c) => c.type === 'TESTIMONIALS',
      );
      expect(testimonials?.entries).toHaveLength(2);
      expect(testimonials?.entries[0]).toMatchObject({
        name: 'Alice',
        rating: 5,
        text: 'Great service!',
      });
      expect(testimonials?.entries[1]).toMatchObject({
        name: 'Bob',
        rating: 4,
        text: 'Very good.',
      });
      // Every entry gets a persisted id, distinct from the other entries.
      expect(testimonials?.entries[0].id).not.toBe(testimonials?.entries[1].id);
    });

    it('preserves testimonial entry order across a full-replace update', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `testimonials-order-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'TESTIMONIALS',
              entries: [
                { name: 'First', rating: 5, text: 'One' },
                { name: 'Second', rating: 4, text: 'Two' },
                { name: 'Third', rating: 3, text: 'Three' },
              ],
            },
          ],
        } as unknown as CreateEcardDto,
        [],
      );

      const updated = await service.updateById(
        created.id,
        {
          endpoint: created.endpoint,
          heroName: created.hero.name,
          heroEmail: created.hero.email,
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'TESTIMONIALS',
              // Reversed order plus a dropped entry — a full replace, not a patch.
              entries: [
                { name: 'Third', rating: 3, text: 'Three' },
                { name: 'First', rating: 5, text: 'One' },
              ],
            },
          ],
        } as unknown as UpdateEcardDto,
        [],
      );

      const testimonials = updated.components.find(
        (c) => c.type === 'TESTIMONIALS',
      );
      expect(testimonials?.entries.map((e) => e.name)).toEqual([
        'Third',
        'First',
      ]);
    });

    it('removes LOCATION_TILE and REVIEW_LINK components entirely on update when omitted', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `remove-new-components-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'LOCATION_TILE',
              label: 'Head Office',
              latitude: 1,
              longitude: 2,
            },
            { type: 'REVIEW_LINK', url: 'https://example.com/review' },
          ],
        } as unknown as CreateEcardDto,
        [],
      );
      expect(created.components).toHaveLength(2);

      const updated = await service.updateById(
        created.id,
        {
          endpoint: created.endpoint,
          heroName: created.hero.name,
          heroEmail: created.hero.email,
          isExchangeContactEnabled: true,
          components: EMPTY_COMPONENTS,
        } as unknown as UpdateEcardDto,
        [],
      );

      expect(updated.components).toHaveLength(0);
      await expect(
        prisma.eCardLocationTileComponent.findFirst({
          where: { ecardComponent: { ecardId: created.id } },
        }),
      ).resolves.toBeNull();
      await expect(
        prisma.eCardReviewLinkComponent.findFirst({
          where: { ecardComponent: { ecardId: created.id } },
        }),
      ).resolves.toBeNull();
    });
  });

  describe('SOCIAL_LINKS component', () => {
    it('creates and returns a SOCIAL_LINKS component including youtube', async () => {
      const customer = await seedCustomer();

      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `social-links-youtube-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'SOCIAL_LINKS',
              website: 'https://example.com',
              youtube: 'https://www.youtube.com/@example',
            },
          ],
        } as unknown as CreateEcardDto,
        [],
      );

      const socialLinks = created.components.find(
        (c) => c.type === 'SOCIAL_LINKS',
      );
      expect(socialLinks).toMatchObject({
        website: 'https://example.com',
        youtube: 'https://www.youtube.com/@example',
        instagram: null,
      });
    });

    it('updates the youtube link on a full-replace update', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `social-links-youtube-update-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'SOCIAL_LINKS',
              youtube: 'https://www.youtube.com/@original',
            },
          ],
        } as unknown as CreateEcardDto,
        [],
      );

      const updated = await service.updateById(
        created.id,
        {
          endpoint: created.endpoint,
          heroName: created.hero.name,
          heroEmail: created.hero.email,
          isExchangeContactEnabled: true,
          components: [
            {
              type: 'SOCIAL_LINKS',
              youtube: 'https://www.youtube.com/@updated',
            },
          ],
        } as unknown as UpdateEcardDto,
        [],
      );

      const socialLinks = updated.components.find(
        (c) => c.type === 'SOCIAL_LINKS',
      );
      expect(socialLinks).toMatchObject({
        youtube: 'https://www.youtube.com/@updated',
      });
    });

    it('rejects an invalid (non-URL) youtube value at the DTO layer', () => {
      // Service methods don't re-validate (validation happens in the
      // controller's ZodValidationPipe), so this asserts against the schema
      // directly rather than through service.createForCustomer.
      const result = ecardSocialLinksComponentSchema.safeParse({
        type: 'SOCIAL_LINKS',
        youtube: 'not-a-url',
      });
      expect(result.success).toBe(false);
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
        [],
      );

      const result = await service.list({
        customerId: customer.id,
        page: 1,
        pageSize: 20,
      });

      expect(result.ecards.map((c) => c.id)).toEqual([created.id]);
    });

    it('getById and getByEndpoint both surface autoDownloadContact under hero', async () => {
      const customer = await seedCustomer();
      const created = await service.createForCustomer(
        customer.id,
        {
          endpoint: `get-auto-download-${randomUUID()}`,
          heroName: 'Test Customer',
          heroEmail: 'test@example.com',
          isExchangeContactEnabled: true,
          autoDownloadContact: true,
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
        [],
      );

      const byId = await service.getById(created.id);
      const byEndpoint = await service.getByEndpoint(created.endpoint);

      expect(byId.hero.autoDownloadContact).toBe(true);
      expect(byEndpoint.hero.autoDownloadContact).toBe(true);
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardAsSpocDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardAsSpocDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardAsSpocDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardAsSpocDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardAsSpocDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as CreateEcardAsSpocDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as UpdateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardAsSpocDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as UpdateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as UpdateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as UpdateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
            components: EMPTY_COMPONENTS,
          } as unknown as UpdateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as UpdateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
        [],
      );
      await service.createForCustomer(
        member.id,
        {
          endpoint: `list-unlinked-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
        [],
      );
      const newCard = await service.createForCustomer(
        member.id,
        {
          endpoint: `new-card-${randomUUID()}`,
          heroName: 'Member One',
          heroEmail: 'member-one@example.com',
          isExchangeContactEnabled: true,
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
          components: EMPTY_COMPONENTS,
        } as unknown as CreateEcardDto,
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
