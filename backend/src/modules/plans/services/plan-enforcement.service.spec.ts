import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ECardAccentColorPresetThemeAffinity,
  ECardComponentType,
  ECardHeroLayout,
  ECardIconShape,
  ECardTheme,
  EventMemberRole,
  PlanBusinessModelType,
  SmartCardTemplateKey,
} from '../../../generated/prisma/client';
import {
  ECARD_GATED_HERO_LAYOUTS,
  ECARD_GATED_ICON_SHAPES,
  ECARD_GATED_THEMES,
} from '../../ecards/ecards.constants';
import { PlanEnforcementService } from './plan-enforcement.service';
import { PlanPolicyResolverService } from './plan-policy-resolver.service';

interface PlanOverrides {
  isFallbackPlan?: boolean;
  ecardIsAvailable?: boolean;
  maxEcards?: number;
  ecardExchangeContactAccess?: boolean;
  galleryLimits?: {
    maxGalleries: number;
    maxImagesPerGallery: number;
    maxGallerySizeBytes: number;
  };
  // Defaults to every gated layout OFF, matching every real plan's
  // default-off state — override with the specific layouts a test needs on.
  availableHeroLayouts?: ECardHeroLayout[];
  orgAvailableHeroLayouts?: ECardHeroLayout[];
  availableThemes?: ECardTheme[];
  orgAvailableThemes?: ECardTheme[];
  availableIconShapes?: ECardIconShape[];
  orgAvailableIconShapes?: ECardIconShape[];
  accentColorCustomizationAvailable?: boolean;
  orgAccentColorCustomizationAvailable?: boolean;
  accentColorPresets?: {
    themeAffinity: ECardAccentColorPresetThemeAffinity;
    primaryColor: string;
    secondaryColor: string;
  }[];
  orgAccentColorPresets?: {
    themeAffinity: ECardAccentColorPresetThemeAffinity;
    primaryColor: string;
    secondaryColor: string;
  }[];
  smartCardIsAvailable?: boolean;
  maxSmartCards?: number;
  smartCardExchangeContactAccess?: boolean;
  whitelistedTemplateIds?: string[];
  orgIsAvailable?: boolean;
  maxOrgsCanJoin?: number;
  maxOrgsCanCreate?: number;
  orgEcardExchangeContactAccess?: boolean;
  eventIsAvailable?: boolean;
  maxEvents?: number;
  maxGuestsPerEvent?: number;
}

describe('PlanEnforcementService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let resolver: PlanPolicyResolverService;
  let service: PlanEnforcementService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededPlanIds: string[] = [];
  const seededOrganisationIds: string[] = [];
  const seededEventIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    resolver = new PlanPolicyResolverService(prisma);
    service = new PlanEnforcementService(prisma, resolver);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededEventIds.length > 0) {
      await prisma.businessEvent.deleteMany({
        where: { id: { in: seededEventIds } },
      });
      seededEventIds.length = 0;
    }
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
    if (seededPlanIds.length > 0) {
      await prisma.plan.deleteMany({ where: { id: { in: seededPlanIds } } });
      seededPlanIds.length = 0;
    }
  });

  async function seedCustomer(name = 'Test Customer') {
    const account = await prisma.customerAccount.create({
      data: {
        name,
        email: `plan-enforcement-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  function ecardPolicyCreateData(
    overrides: PlanOverrides,
    availableHeroLayouts: ECardHeroLayout[] = [],
    availableThemes: ECardTheme[] = [],
    availableIconShapes: ECardIconShape[] = [],
    accentColorCustomizationAvailable = false,
    accentColorPresets: PlanOverrides['accentColorPresets'] = [],
  ) {
    return {
      isAvailable: overrides.ecardIsAvailable ?? true,
      maxEcards: overrides.maxEcards ?? 3,
      exchangeContactAccess: overrides.ecardExchangeContactAccess ?? false,
      accentColorCustomizationAvailable,
      componentAvailabilities: {
        create: Object.values(ECardComponentType).map((type) => ({
          type,
          isAvailable: true,
          ...(type === ECardComponentType.GALLERY && {
            galleryLimits: {
              create: overrides.galleryLimits ?? {
                maxGalleries: 3,
                maxImagesPerGallery: 10,
                maxGallerySizeBytes: 1024,
              },
            },
          }),
        })),
      },
      heroLayoutAvailabilities: {
        create: ECARD_GATED_HERO_LAYOUTS.map((layout) => ({
          layout,
          isAvailable: availableHeroLayouts.includes(layout),
        })),
      },
      themeAvailabilities: {
        create: ECARD_GATED_THEMES.map((theme) => ({
          theme,
          isAvailable: availableThemes.includes(theme),
        })),
      },
      iconShapeAvailabilities: {
        create: ECARD_GATED_ICON_SHAPES.map((iconShape) => ({
          iconShape,
          isAvailable: availableIconShapes.includes(iconShape),
        })),
      },
      accentColorPresets: {
        create: (accentColorPresets ?? []).map((preset, order) => ({
          ...preset,
          order,
        })),
      },
    };
  }

  async function seedPlan(overrides: PlanOverrides = {}) {
    const plan = await prisma.plan.create({
      data: {
        name: `Test Plan ${randomUUID()}`,
        price: 0,
        businessModelType: PlanBusinessModelType.ONE_TIME,
        isFallbackPlan: overrides.isFallbackPlan ?? false,
        policy: {
          create: {
            ecardPolicy: {
              create: ecardPolicyCreateData(
                overrides,
                overrides.availableHeroLayouts,
                overrides.availableThemes,
                overrides.availableIconShapes,
                overrides.accentColorCustomizationAvailable,
                overrides.accentColorPresets,
              ),
            },
            smartCardPolicy: {
              create: {
                isAvailable: overrides.smartCardIsAvailable ?? true,
                maxSmartCards: overrides.maxSmartCards ?? 2,
                exchangeContactAccess:
                  overrides.smartCardExchangeContactAccess ?? false,
                whitelistedTemplates: overrides.whitelistedTemplateIds
                  ? {
                      create: overrides.whitelistedTemplateIds.map(
                        (templateId) => ({ templateId }),
                      ),
                    }
                  : undefined,
              },
            },
            organisationPolicy: {
              create: {
                isAvailable: overrides.orgIsAvailable ?? true,
                maxOrgsCanJoin: overrides.maxOrgsCanJoin ?? 1,
                maxOrgsCanCreate: overrides.maxOrgsCanCreate ?? 1,
                orgEcardPolicy: {
                  create: {
                    isAvailable: true,
                    maxEcards: 0,
                    exchangeContactAccess:
                      overrides.orgEcardExchangeContactAccess ?? false,
                    accentColorCustomizationAvailable:
                      overrides.orgAccentColorCustomizationAvailable ?? false,
                    componentAvailabilities: {
                      create: Object.values(ECardComponentType).map((type) => ({
                        type,
                        isAvailable: true,
                        ...(type === ECardComponentType.GALLERY && {
                          galleryLimits: {
                            create: {
                              maxGalleries: 0,
                              maxImagesPerGallery: 0,
                              maxGallerySizeBytes: 0,
                            },
                          },
                        }),
                      })),
                    },
                    heroLayoutAvailabilities: {
                      create: ECARD_GATED_HERO_LAYOUTS.map((layout) => ({
                        layout,
                        isAvailable: (
                          overrides.orgAvailableHeroLayouts ?? []
                        ).includes(layout),
                      })),
                    },
                    themeAvailabilities: {
                      create: ECARD_GATED_THEMES.map((theme) => ({
                        theme,
                        isAvailable: (
                          overrides.orgAvailableThemes ?? []
                        ).includes(theme),
                      })),
                    },
                    iconShapeAvailabilities: {
                      create: ECARD_GATED_ICON_SHAPES.map((iconShape) => ({
                        iconShape,
                        isAvailable: (
                          overrides.orgAvailableIconShapes ?? []
                        ).includes(iconShape),
                      })),
                    },
                    accentColorPresets: {
                      create: (overrides.orgAccentColorPresets ?? []).map(
                        (preset, order) => ({ ...preset, order }),
                      ),
                    },
                  },
                },
                orgSmartCardPolicy: {
                  create: {
                    isAvailable: true,
                    maxSmartCards: 0,
                    exchangeContactAccess: false,
                  },
                },
              },
            },
            eventPolicy: {
              create: {
                isAvailable: overrides.eventIsAvailable ?? true,
                maxEvents: overrides.maxEvents ?? 2,
                maxGuestsPerEvent: overrides.maxGuestsPerEvent ?? 5,
              },
            },
          },
        },
      },
    });
    seededPlanIds.push(plan.id);
    return plan;
  }

  async function assignPlan(customerId: string, planId: string) {
    const employeeAccount = await prisma.employeeAccount.create({
      data: {
        name: 'Assigning Employee',
        email: `plan-enforcement-employee-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'admin',
      },
    });
    seededEmployeeAccountIds.push(employeeAccount.id);
    const employee = await prisma.employee.create({
      data: { accountId: employeeAccount.id },
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: { currentPlanId: planId },
    });
    await prisma.planPurchaseHistory.create({
      data: {
        customerId,
        planId,
        assignedByEmployeeId: employee.id,
        expiresAt: null,
        businessModelTypeAtPurchase: PlanBusinessModelType.ONE_TIME,
      },
    });
  }

  describe('assertCanCreateEcard', () => {
    it('passes when under the e-card cap', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxEcards: 3 });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertCanCreateEcard(customer.id),
      ).resolves.toBeUndefined();
    });

    it('blocks when at the e-card cap', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxEcards: 1 });
      await assignPlan(customer.id, plan.id);
      await prisma.eCard.create({
        data: {
          customerId: customer.id,
          endpoint: `enforcement-test-${randomUUID()}`,
          heroName: 'Test',
          heroEmail: 'test@example.com',
        },
      });

      await expect(service.assertCanCreateEcard(customer.id)).rejects.toThrow(
        "This customer's plan has reached its e-card limit",
      );
    });

    it('blocks when e-cards are not available on the plan at all', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ ecardIsAvailable: false });
      await assignPlan(customer.id, plan.id);

      await expect(service.assertCanCreateEcard(customer.id)).rejects.toThrow(
        "This customer's plan does not include e-cards",
      );
    });
  });

  describe('assertCanAddGalleryContent', () => {
    const limits = {
      maxGalleries: 2,
      maxImagesPerGallery: 4,
      maxGallerySizeBytes: 1024,
    };

    it('never blocks when the incoming count is not higher than existing (grandfathered)', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ galleryLimits: limits });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertCanAddGalleryContent(
          customer.id,
          {
            organisationId: null,
            existingSubGalleryCount: 5,
            existingTotalImageCount: 20,
          },
          { subGalleries: [{ images: [1, 2] }] },
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks adding a new sub-gallery once already at the cap', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ galleryLimits: limits });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertCanAddGalleryContent(
          customer.id,
          {
            organisationId: null,
            existingSubGalleryCount: 2,
            existingTotalImageCount: 0,
          },
          { subGalleries: [{ images: [] }, { images: [] }, { images: [] }] },
        ),
      ).rejects.toThrow(
        "This customer's plan has reached its gallery limit for this e-card",
      );
    });

    it('allows adding a new sub-gallery when under the cap', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ galleryLimits: limits });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertCanAddGalleryContent(
          customer.id,
          {
            organisationId: null,
            existingSubGalleryCount: 1,
            existingTotalImageCount: 0,
          },
          { subGalleries: [{ images: [] }, { images: [] }] },
        ),
      ).resolves.toBeUndefined();
    });

    it('is a no-op when the payload has no gallery component', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan();
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertCanAddGalleryContent(customer.id, null, undefined),
      ).resolves.toBeUndefined();
    });
  });

  describe('assertCanCreateSmartCard / assertSmartCardTemplateAllowed', () => {
    it('no-ops for an unclaimed smart card (customerId null)', async () => {
      await expect(
        service.assertCanCreateSmartCard(null),
      ).resolves.toBeUndefined();
      await expect(
        service.assertSmartCardTemplateAllowed(
          null,
          SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks creating a smart card at the cap', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxSmartCards: 0 });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertCanCreateSmartCard(customer.id),
      ).rejects.toThrow(
        "This customer's plan has reached its smart card limit",
      );
    });

    it('blocks a template not in the whitelist', async () => {
      const customer = await seedCustomer();
      const template = await prisma.smartCardTemplate.findUniqueOrThrow({
        where: { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE },
      });
      const otherTemplate = await prisma.smartCardTemplate.findUniqueOrThrow({
        where: { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_2 },
      });
      const plan = await seedPlan({ whitelistedTemplateIds: [template.id] });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertSmartCardTemplateAllowed(customer.id, otherTemplate.key),
      ).rejects.toThrow(
        "This customer's plan does not allow this smart card template",
      );
    });

    it('allows a whitelisted template', async () => {
      const customer = await seedCustomer();
      const template = await prisma.smartCardTemplate.findUniqueOrThrow({
        where: { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE },
      });
      const plan = await seedPlan({ whitelistedTemplateIds: [template.id] });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertSmartCardTemplateAllowed(customer.id, template.key),
      ).resolves.toBeUndefined();
    });
  });

  describe('assertExchangeContactAllowed', () => {
    it('passes for e-card exchange contact boosted by the org even when personal plan denies it', async () => {
      const creator = await seedCustomer('Creator');
      const creatorPlan = await seedPlan({
        orgEcardExchangeContactAccess: true,
      });
      await assignPlan(creator.id, creatorPlan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      const owner = await seedCustomer('Owner');
      const ownerPlan = await seedPlan({ ecardExchangeContactAccess: false });
      await assignPlan(owner.id, ownerPlan.id);

      await expect(
        service.assertExchangeContactAllowed(
          'ECARD',
          owner.id,
          organisation.id,
        ),
      ).resolves.toBeUndefined();
    });

    it('passes when the personal plan alone grants access with no organisation', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ ecardExchangeContactAccess: true });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertExchangeContactAllowed('ECARD', customer.id, null),
      ).resolves.toBeUndefined();
    });

    it('blocks when neither the personal plan nor any org grants access', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ ecardExchangeContactAccess: false });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertExchangeContactAllowed('ECARD', customer.id, null),
      ).rejects.toThrow(
        "This customer's plan does not include exchange contact",
      );
    });

    it('no-ops for an unclaimed smart card', async () => {
      await expect(
        service.assertExchangeContactAllowed('SMART_CARD', null),
      ).resolves.toBeUndefined();
    });
  });

  describe('assertCanJoinOrganisation / assertCanCreateOrganisation', () => {
    it('blocks joining once at the join cap', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxOrgsCanJoin: 1 });
      await assignPlan(customer.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Existing Org' },
      });
      seededOrganisationIds.push(organisation.id);
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: customer.id },
      });

      await expect(
        service.assertCanJoinOrganisation(customer.id),
      ).rejects.toThrow(
        "This customer's plan has reached its organisation-membership limit",
      );
    });

    it('allows joining when under the cap', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxOrgsCanJoin: 2 });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertCanJoinOrganisation(customer.id),
      ).resolves.toBeUndefined();
    });

    it('blocks creating once at the create cap', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxOrgsCanCreate: 1 });
      await assignPlan(customer.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Existing Org', createdByCustomerId: customer.id },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertCanCreateOrganisation(customer.id),
      ).rejects.toThrow(
        "This customer's plan has reached its organisation-creation limit",
      );
    });

    it('blocks entirely when organisations are not available on the plan', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ orgIsAvailable: false });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertCanJoinOrganisation(customer.id),
      ).rejects.toThrow("This customer's plan does not include organisations");
    });
  });

  describe('assertCanCreateEvent', () => {
    it('passes when under the event cap', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxEvents: 2 });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertCanCreateEvent(customer.id),
      ).resolves.toBeUndefined();
    });

    it('blocks once at the event cap', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxEvents: 1 });
      await assignPlan(customer.id, plan.id);
      const event = await prisma.businessEvent.create({
        data: { name: 'Existing Event', startAt: new Date() },
      });
      seededEventIds.push(event.id);
      await prisma.eventMember.create({
        data: {
          eventId: event.id,
          customerId: customer.id,
          role: EventMemberRole.HOST,
        },
      });

      await expect(service.assertCanCreateEvent(customer.id)).rejects.toThrow(
        "This customer's plan has reached its event limit",
      );
    });

    it('blocks entirely when events are not available on the plan', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ eventIsAvailable: false });
      await assignPlan(customer.id, plan.id);

      await expect(service.assertCanCreateEvent(customer.id)).rejects.toThrow(
        "This customer's plan does not include business events",
      );
    });
  });

  describe('assertHeroLayoutAllowedForCard', () => {
    it('always passes for DEFAULT, even with no plan assigned at all', async () => {
      const customer = await seedCustomer();

      await expect(
        service.assertHeroLayoutAllowedForCard(
          { customerId: customer.id, organisationId: null },
          ECardHeroLayout.DEFAULT,
        ),
      ).resolves.toBeUndefined();
    });

    it('passes for a gated layout the plan explicitly allows', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        availableHeroLayouts: [ECardHeroLayout.BANNER],
      });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertHeroLayoutAllowedForCard(
          { customerId: customer.id, organisationId: null },
          ECardHeroLayout.BANNER,
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks a gated layout the plan does not allow (default-off)', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan();
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertHeroLayoutAllowedForCard(
          { customerId: customer.id, organisationId: null },
          ECardHeroLayout.ORG_BADGE,
        ),
      ).rejects.toThrow('This plan does not include this Hero layout');
    });

    it("passes via the organisation's boost even when the personal plan denies it", async () => {
      const creator = await seedCustomer('Creator');
      const creatorPlan = await seedPlan({
        orgAvailableHeroLayouts: [ECardHeroLayout.BANNER_PROFILE],
      });
      await assignPlan(creator.id, creatorPlan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      const owner = await seedCustomer('Owner');
      const ownerPlan = await seedPlan();
      await assignPlan(owner.id, ownerPlan.id);

      await expect(
        service.assertHeroLayoutAllowedForCard(
          { customerId: owner.id, organisationId: organisation.id },
          ECardHeroLayout.BANNER_PROFILE,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('assertHeroLayoutAllowedForOrganisationTemplate', () => {
    it('always passes for DEFAULT', async () => {
      const creator = await seedCustomer('Creator');
      const plan = await seedPlan();
      await assignPlan(creator.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertHeroLayoutAllowedForOrganisationTemplate(
          organisation.id,
          ECardHeroLayout.DEFAULT,
        ),
      ).resolves.toBeUndefined();
    });

    it("passes for a layout the org creator's plan grants to the organisation", async () => {
      const creator = await seedCustomer('Creator');
      const plan = await seedPlan({
        orgAvailableHeroLayouts: [ECardHeroLayout.ORG_BADGE],
      });
      await assignPlan(creator.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertHeroLayoutAllowedForOrganisationTemplate(
          organisation.id,
          ECardHeroLayout.ORG_BADGE,
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks a layout not granted to the organisation (default-off)', async () => {
      const creator = await seedCustomer('Creator');
      const plan = await seedPlan();
      await assignPlan(creator.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertHeroLayoutAllowedForOrganisationTemplate(
          organisation.id,
          ECardHeroLayout.BANNER,
        ),
      ).rejects.toThrow('This plan does not include this Hero layout');
    });

    it('fails closed when the organisation has no resolvable creator', async () => {
      const organisation = await prisma.organisation.create({
        data: { name: 'Ownerless Org' },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertHeroLayoutAllowedForOrganisationTemplate(
          organisation.id,
          ECardHeroLayout.BANNER,
        ),
      ).rejects.toThrow('This plan does not include this Hero layout');
    });
  });

  describe('assertThemeAllowedForCard', () => {
    it('always passes for DEFAULT_DARK, even with no plan assigned at all', async () => {
      const customer = await seedCustomer();

      await expect(
        service.assertThemeAllowedForCard(
          { customerId: customer.id, organisationId: null },
          ECardTheme.DEFAULT_DARK,
        ),
      ).resolves.toBeUndefined();
    });

    it('passes for a gated theme the plan explicitly allows', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ availableThemes: [ECardTheme.LIGHT] });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertThemeAllowedForCard(
          { customerId: customer.id, organisationId: null },
          ECardTheme.LIGHT,
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks a gated theme the plan does not allow (default-off)', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan();
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertThemeAllowedForCard(
          { customerId: customer.id, organisationId: null },
          ECardTheme.NAVY_TEAL,
        ),
      ).rejects.toThrow('This plan does not include this theme');
    });

    it("passes via the organisation's boost even when the personal plan denies it", async () => {
      const creator = await seedCustomer('Creator');
      const creatorPlan = await seedPlan({
        orgAvailableThemes: [ECardTheme.NAVY_TEAL],
      });
      await assignPlan(creator.id, creatorPlan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      const owner = await seedCustomer('Owner');
      const ownerPlan = await seedPlan();
      await assignPlan(owner.id, ownerPlan.id);

      await expect(
        service.assertThemeAllowedForCard(
          { customerId: owner.id, organisationId: organisation.id },
          ECardTheme.NAVY_TEAL,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('assertThemeAllowedForOrganisationTemplate', () => {
    it('always passes for DEFAULT_DARK', async () => {
      const creator = await seedCustomer('Creator');
      const plan = await seedPlan();
      await assignPlan(creator.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertThemeAllowedForOrganisationTemplate(
          organisation.id,
          ECardTheme.DEFAULT_DARK,
        ),
      ).resolves.toBeUndefined();
    });

    it("passes for a theme the org creator's plan grants to the organisation", async () => {
      const creator = await seedCustomer('Creator');
      const plan = await seedPlan({
        orgAvailableThemes: [ECardTheme.LIGHT],
      });
      await assignPlan(creator.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertThemeAllowedForOrganisationTemplate(
          organisation.id,
          ECardTheme.LIGHT,
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks a theme not granted to the organisation (default-off)', async () => {
      const creator = await seedCustomer('Creator');
      const plan = await seedPlan();
      await assignPlan(creator.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertThemeAllowedForOrganisationTemplate(
          organisation.id,
          ECardTheme.LIGHT,
        ),
      ).rejects.toThrow('This plan does not include this theme');
    });

    it('fails closed when the organisation has no resolvable creator', async () => {
      const organisation = await prisma.organisation.create({
        data: { name: 'Ownerless Org' },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertThemeAllowedForOrganisationTemplate(
          organisation.id,
          ECardTheme.LIGHT,
        ),
      ).rejects.toThrow('This plan does not include this theme');
    });
  });

  describe('assertIconShapeAllowedForCard', () => {
    it('always passes for CIRCLE, even with no plan assigned at all', async () => {
      const customer = await seedCustomer();

      await expect(
        service.assertIconShapeAllowedForCard(
          { customerId: customer.id, organisationId: null },
          ECardIconShape.CIRCLE,
        ),
      ).resolves.toBeUndefined();
    });

    it('passes for a gated icon shape the plan explicitly allows', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        availableIconShapes: [ECardIconShape.SQUIRCLE],
      });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertIconShapeAllowedForCard(
          { customerId: customer.id, organisationId: null },
          ECardIconShape.SQUIRCLE,
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks a gated icon shape the plan does not allow (default-off)', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan();
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertIconShapeAllowedForCard(
          { customerId: customer.id, organisationId: null },
          ECardIconShape.TEARDROP,
        ),
      ).rejects.toThrow('This plan does not include this icon shape');
    });

    it("passes via the organisation's boost even when the personal plan denies it", async () => {
      const creator = await seedCustomer('Creator');
      const creatorPlan = await seedPlan({
        orgAvailableIconShapes: [ECardIconShape.ROUNDED_SQUARE],
      });
      await assignPlan(creator.id, creatorPlan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      const owner = await seedCustomer('Owner');
      const ownerPlan = await seedPlan();
      await assignPlan(owner.id, ownerPlan.id);

      await expect(
        service.assertIconShapeAllowedForCard(
          { customerId: owner.id, organisationId: organisation.id },
          ECardIconShape.ROUNDED_SQUARE,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('assertIconShapeAllowedForOrganisationTemplate', () => {
    it('always passes for CIRCLE', async () => {
      const creator = await seedCustomer('Creator');
      const plan = await seedPlan();
      await assignPlan(creator.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertIconShapeAllowedForOrganisationTemplate(
          organisation.id,
          ECardIconShape.CIRCLE,
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks an icon shape not granted to the organisation (default-off)', async () => {
      const creator = await seedCustomer('Creator');
      const plan = await seedPlan();
      await assignPlan(creator.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertIconShapeAllowedForOrganisationTemplate(
          organisation.id,
          ECardIconShape.SQUIRCLE,
        ),
      ).rejects.toThrow('This plan does not include this icon shape');
    });

    it('fails closed when the organisation has no resolvable creator', async () => {
      const organisation = await prisma.organisation.create({
        data: { name: 'Ownerless Org' },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertIconShapeAllowedForOrganisationTemplate(
          organisation.id,
          ECardIconShape.SQUIRCLE,
        ),
      ).rejects.toThrow('This plan does not include this icon shape');
    });
  });

  describe('assertAccentColorCustomizationAllowedForCard', () => {
    it('always passes when both colors are null', async () => {
      const customer = await seedCustomer();

      await expect(
        service.assertAccentColorCustomizationAllowedForCard(
          { customerId: customer.id, organisationId: null },
          { primary: null, secondary: null },
        ),
      ).resolves.toBeUndefined();
    });

    it('passes when the pair matches an available preset, with the custom toggle off', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        accentColorCustomizationAvailable: false,
        accentColorPresets: [
          {
            themeAffinity: ECardAccentColorPresetThemeAffinity.DARK,
            primaryColor: '#111111',
            secondaryColor: '#222222',
          },
        ],
      });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertAccentColorCustomizationAllowedForCard(
          { customerId: customer.id, organisationId: null },
          { primary: '#111111', secondary: '#222222' },
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks a pair that matches no preset when the custom toggle is off', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ accentColorCustomizationAvailable: false });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertAccentColorCustomizationAllowedForCard(
          { customerId: customer.id, organisationId: null },
          { primary: '#abcdef', secondary: '#fedcba' },
        ),
      ).rejects.toThrow(
        "This customer's plan does not allow custom accent colors",
      );
    });

    it('allows an arbitrary non-preset pair when the custom toggle is on', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ accentColorCustomizationAvailable: true });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertAccentColorCustomizationAllowedForCard(
          { customerId: customer.id, organisationId: null },
          { primary: '#abcdef', secondary: '#fedcba' },
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks a partial pair (only one color set) that matches no preset, with the toggle off', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        accentColorCustomizationAvailable: false,
        accentColorPresets: [
          {
            themeAffinity: ECardAccentColorPresetThemeAffinity.DARK,
            primaryColor: '#111111',
            secondaryColor: '#222222',
          },
        ],
      });
      await assignPlan(customer.id, plan.id);

      await expect(
        service.assertAccentColorCustomizationAllowedForCard(
          { customerId: customer.id, organisationId: null },
          { primary: '#111111', secondary: null },
        ),
      ).rejects.toThrow(
        "This customer's plan does not allow custom accent colors",
      );
    });

    it("passes via the organisation's boosted custom-color toggle even when the personal plan denies it", async () => {
      const creator = await seedCustomer('Creator');
      const creatorPlan = await seedPlan({
        orgAccentColorCustomizationAvailable: true,
      });
      await assignPlan(creator.id, creatorPlan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      const owner = await seedCustomer('Owner');
      const ownerPlan = await seedPlan({
        accentColorCustomizationAvailable: false,
      });
      await assignPlan(owner.id, ownerPlan.id);

      await expect(
        service.assertAccentColorCustomizationAllowedForCard(
          { customerId: owner.id, organisationId: organisation.id },
          { primary: '#abcdef', secondary: '#fedcba' },
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('assertAccentColorCustomizationAllowedForOrganisationTemplate', () => {
    it('always passes when both colors are null', async () => {
      const creator = await seedCustomer('Creator');
      const plan = await seedPlan();
      await assignPlan(creator.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertAccentColorCustomizationAllowedForOrganisationTemplate(
          organisation.id,
          { primary: null, secondary: null },
        ),
      ).resolves.toBeUndefined();
    });

    it("blocks a pair not covered by the org creator's plan (default-off)", async () => {
      const creator = await seedCustomer('Creator');
      const plan = await seedPlan();
      await assignPlan(creator.id, plan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertAccentColorCustomizationAllowedForOrganisationTemplate(
          organisation.id,
          { primary: '#abcdef', secondary: '#fedcba' },
        ),
      ).rejects.toThrow(
        "This customer's plan does not allow custom accent colors",
      );
    });

    it('fails closed when the organisation has no resolvable creator', async () => {
      const organisation = await prisma.organisation.create({
        data: { name: 'Ownerless Org' },
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.assertAccentColorCustomizationAllowedForOrganisationTemplate(
          organisation.id,
          { primary: '#abcdef', secondary: '#fedcba' },
        ),
      ).rejects.toThrow(
        "This customer's plan does not allow custom accent colors",
      );
    });
  });

  describe('assertCanAddEventGuest', () => {
    it("passes when under the host's guest cap", async () => {
      const host = await seedCustomer();
      const plan = await seedPlan({ maxGuestsPerEvent: 2 });
      await assignPlan(host.id, plan.id);
      const event = await prisma.businessEvent.create({
        data: { name: 'Test Event', startAt: new Date() },
      });
      seededEventIds.push(event.id);
      await prisma.eventMember.create({
        data: {
          eventId: event.id,
          customerId: host.id,
          role: EventMemberRole.HOST,
        },
      });

      await expect(
        service.assertCanAddEventGuest(event.id),
      ).resolves.toBeUndefined();
    });

    it("blocks once at the host's guest cap", async () => {
      const host = await seedCustomer();
      const plan = await seedPlan({ maxGuestsPerEvent: 1 });
      await assignPlan(host.id, plan.id);
      const event = await prisma.businessEvent.create({
        data: { name: 'Test Event', startAt: new Date() },
      });
      seededEventIds.push(event.id);
      await prisma.eventMember.create({
        data: {
          eventId: event.id,
          customerId: host.id,
          role: EventMemberRole.HOST,
        },
      });
      const guest = await seedCustomer('Guest');
      await prisma.eventGuest.create({
        data: { eventId: event.id, customerId: guest.id },
      });

      await expect(service.assertCanAddEventGuest(event.id)).rejects.toThrow(
        "This event's host plan has reached its guest limit for this event",
      );
    });
  });
});
