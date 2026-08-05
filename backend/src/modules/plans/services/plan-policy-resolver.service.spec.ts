import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ECardAccentColorPresetThemeAffinity,
  ECardComponentType,
  ECardHeroLayout,
  ECardIconShape,
  ECardTheme,
  PlanBusinessModelType,
} from '../../../generated/prisma/client';
import {
  ECARD_GATED_HERO_LAYOUTS,
  ECARD_GATED_ICON_SHAPES,
  ECARD_GATED_THEMES,
} from '../../ecards/ecards.constants';
import { PlanPolicyResolverService } from './plan-policy-resolver.service';

interface PlanOverrides {
  isFallbackPlan?: boolean;
  maxEcards?: number;
  ecardExchangeContactAccess?: boolean;
  customFormIsAvailable?: boolean;
  maxCustomForms?: number;
  orgCustomFormIsAvailable?: boolean;
  galleryLimits?: {
    maxGalleries: number;
    maxImagesPerGallery: number;
    maxGallerySizeBytes: number;
  };
  videoGalleryLimits?: {
    maxVideoGalleries: number;
    maxVideosPerGallery: number;
  };
  componentAvailability?: Partial<Record<ECardComponentType, boolean>>;
  heroLayoutAvailability?: Partial<Record<ECardHeroLayout, boolean>>;
  themeAvailability?: Partial<Record<ECardTheme, boolean>>;
  iconShapeAvailability?: Partial<Record<ECardIconShape, boolean>>;
  accentColorCustomizationAvailable?: boolean;
  accentColorPresets?: {
    themeAffinity: ECardAccentColorPresetThemeAffinity;
    primaryColor: string;
    secondaryColor: string;
  }[];
  maxSmartCards?: number;
  smartCardExchangeContactAccess?: boolean;
  orgIsAvailable?: boolean;
  maxOrgsCanJoin?: number;
  maxOrgsCanCreate?: number;
  orgEcardExchangeContactAccess?: boolean;
  orgEcardComponentAvailability?: Partial<Record<ECardComponentType, boolean>>;
  orgHeroLayoutAvailability?: Partial<Record<ECardHeroLayout, boolean>>;
  orgThemeAvailability?: Partial<Record<ECardTheme, boolean>>;
  orgIconShapeAvailability?: Partial<Record<ECardIconShape, boolean>>;
  orgAccentColorCustomizationAvailable?: boolean;
  orgAccentColorPresets?: {
    themeAffinity: ECardAccentColorPresetThemeAffinity;
    primaryColor: string;
    secondaryColor: string;
  }[];
  orgGalleryLimits?: {
    maxGalleries: number;
    maxImagesPerGallery: number;
    maxGallerySizeBytes: number;
  };
  orgVideoGalleryLimits?: {
    maxVideoGalleries: number;
    maxVideosPerGallery: number;
  };
  eventIsAvailable?: boolean;
  maxEvents?: number;
  maxGuestsPerEvent?: number;
}

describe('PlanPolicyResolverService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: PlanPolicyResolverService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededPlanIds: string[] = [];
  const seededOrganisationIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new PlanPolicyResolverService(prisma);
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
        email: `plan-policy-resolver-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  function ecardPolicyCreateData(
    overrides: PlanOverrides,
    isOrgBundle = false,
  ) {
    const availabilityOverrides = isOrgBundle
      ? overrides.orgEcardComponentAvailability
      : overrides.componentAvailability;
    const limits = isOrgBundle
      ? (overrides.orgGalleryLimits ?? {
          maxGalleries: 0,
          maxImagesPerGallery: 0,
          maxGallerySizeBytes: 0,
        })
      : (overrides.galleryLimits ?? {
          maxGalleries: 3,
          maxImagesPerGallery: 10,
          maxGallerySizeBytes: 1024,
        });
    const videoLimits = isOrgBundle
      ? (overrides.orgVideoGalleryLimits ?? {
          maxVideoGalleries: 0,
          maxVideosPerGallery: 0,
        })
      : (overrides.videoGalleryLimits ?? {
          maxVideoGalleries: 3,
          maxVideosPerGallery: 10,
        });

    const heroLayoutOverrides = isOrgBundle
      ? overrides.orgHeroLayoutAvailability
      : overrides.heroLayoutAvailability;
    const themeOverrides = isOrgBundle
      ? overrides.orgThemeAvailability
      : overrides.themeAvailability;
    const iconShapeOverrides = isOrgBundle
      ? overrides.orgIconShapeAvailability
      : overrides.iconShapeAvailability;
    const accentColorCustomizationAvailable = isOrgBundle
      ? (overrides.orgAccentColorCustomizationAvailable ?? false)
      : (overrides.accentColorCustomizationAvailable ?? false);
    const accentColorPresets = isOrgBundle
      ? (overrides.orgAccentColorPresets ?? [])
      : (overrides.accentColorPresets ?? []);

    return {
      isAvailable: true,
      maxEcards: overrides.maxEcards ?? 3,
      exchangeContactAccess: isOrgBundle
        ? (overrides.orgEcardExchangeContactAccess ?? false)
        : (overrides.ecardExchangeContactAccess ?? false),
      isCustomFormAvailable: isOrgBundle
        ? (overrides.orgCustomFormIsAvailable ?? false)
        : (overrides.customFormIsAvailable ?? false),
      maxCustomForms: isOrgBundle ? 0 : (overrides.maxCustomForms ?? 3),
      accentColorCustomizationAvailable,
      componentAvailabilities: {
        create: Object.values(ECardComponentType).map((type) => ({
          type,
          isAvailable: availabilityOverrides?.[type] ?? true,
          ...(type === ECardComponentType.GALLERY && {
            galleryLimits: { create: limits },
          }),
          ...(type === ECardComponentType.VIDEO_GALLERY && {
            videoGalleryLimits: { create: videoLimits },
          }),
        })),
      },
      heroLayoutAvailabilities: {
        create: ECARD_GATED_HERO_LAYOUTS.map((layout) => ({
          layout,
          isAvailable: heroLayoutOverrides?.[layout] ?? false,
        })),
      },
      themeAvailabilities: {
        create: ECARD_GATED_THEMES.map((theme) => ({
          theme,
          isAvailable: themeOverrides?.[theme] ?? false,
        })),
      },
      iconShapeAvailabilities: {
        create: ECARD_GATED_ICON_SHAPES.map((iconShape) => ({
          iconShape,
          isAvailable: iconShapeOverrides?.[iconShape] ?? false,
        })),
      },
      accentColorPresets: {
        create: accentColorPresets.map((preset, order) => ({
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
            ecardPolicy: { create: ecardPolicyCreateData(overrides) },
            smartCardPolicy: {
              create: {
                isAvailable: true,
                maxSmartCards: overrides.maxSmartCards ?? 2,
                exchangeContactAccess:
                  overrides.smartCardExchangeContactAccess ?? false,
              },
            },
            organisationPolicy: {
              create: {
                isAvailable: overrides.orgIsAvailable ?? true,
                maxOrgsCanJoin: overrides.maxOrgsCanJoin ?? 1,
                maxOrgsCanCreate: overrides.maxOrgsCanCreate ?? 1,
                orgEcardPolicy: {
                  create: ecardPolicyCreateData(overrides, true),
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

  async function assignPlan(
    customerId: string,
    planId: string,
    expiresAt: Date | null = null,
  ) {
    const employeeAccount = await prisma.employeeAccount.create({
      data: {
        name: 'Assigning Employee',
        email: `plan-policy-resolver-employee-${randomUUID()}@example.com`,
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
        expiresAt,
        businessModelTypeAtPurchase: PlanBusinessModelType.ONE_TIME,
      },
    });
  }

  // A generous, permanent fallback fixture already exists in
  // TEST_DATABASE_URL (seeded by the "pretest" script,
  // prisma/scripts/seed-test-fallback-plan.ts) so unrelated modules' tests
  // never hit "no fallback configured". Tests that need to exercise
  // fallback resolution itself temporarily swap that fixture's flag for a
  // purpose-built test plan, then restore it — safe under Jest's
  // maxWorkers: 1 (serial test-file execution), since no other file can
  // observe the swap mid-flight. The temporary plan's own flag must be
  // cleared before the fixture's flag is restored, or both rows briefly
  // have isFallbackPlan: true and the partial unique index rejects it.
  async function withTemporaryFallbackPlan<T>(
    overrides: PlanOverrides,
    run: (temporaryFallbackPlanId: string) => Promise<T>,
  ): Promise<T> {
    const fixture = await prisma.plan.findFirstOrThrow({
      where: { isFallbackPlan: true },
    });
    await prisma.plan.update({
      where: { id: fixture.id },
      data: { isFallbackPlan: false },
    });
    let temporaryPlanId: string | null = null;
    try {
      const temporaryPlan = await seedPlan({
        ...overrides,
        isFallbackPlan: true,
      });
      temporaryPlanId = temporaryPlan.id;
      return await run(temporaryPlan.id);
    } finally {
      if (temporaryPlanId) {
        await prisma.plan.update({
          where: { id: temporaryPlanId },
          data: { isFallbackPlan: false },
        });
      }
      await prisma.plan.update({
        where: { id: fixture.id },
        data: { isFallbackPlan: true },
      });
    }
  }

  describe('getEffectivePolicyForCustomer', () => {
    it("returns the customer's current plan policy when active and not expired", async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxEcards: 7 });
      await assignPlan(customer.id, plan.id);

      const effective = await service.getEffectivePolicyForCustomer(
        customer.id,
      );

      expect(effective.isFallback).toBe(false);
      expect(effective.planId).toBe(plan.id);
      expect(effective.ecard.maxEcards).toBe(7);
    });

    it('resolves the event policy the same way as the other sub-policies', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        eventIsAvailable: false,
        maxEvents: 4,
        maxGuestsPerEvent: 50,
      });
      await assignPlan(customer.id, plan.id);

      const effective = await service.getEffectivePolicyForCustomer(
        customer.id,
      );

      expect(effective.event).toEqual({
        isAvailable: false,
        maxEvents: 4,
        maxGuestsPerEvent: 50,
      });
    });

    it('falls back when the customer has no currentPlanId', async () => {
      const customer = await seedCustomer();

      await withTemporaryFallbackPlan({ maxEcards: 1 }, async (fallbackId) => {
        const effective = await service.getEffectivePolicyForCustomer(
          customer.id,
        );

        expect(effective.isFallback).toBe(true);
        expect(effective.planId).toBe(fallbackId);
      });
    });

    it('falls back when the current assignment has expired (pure date comparison, no cron)', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxEcards: 7 });
      await assignPlan(customer.id, plan.id, new Date(Date.now() - 1000));

      await withTemporaryFallbackPlan({ maxEcards: 1 }, async (fallbackId) => {
        const effective = await service.getEffectivePolicyForCustomer(
          customer.id,
        );

        expect(effective.isFallback).toBe(true);
        expect(effective.planId).toBe(fallbackId);
      });
    });

    it('never falls back when expiresAt is null (lifetime/one-time)', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxEcards: 7 });
      await assignPlan(customer.id, plan.id, null);

      const effective = await service.getEffectivePolicyForCustomer(
        customer.id,
      );

      expect(effective.isFallback).toBe(false);
      expect(effective.planId).toBe(plan.id);
    });

    it('throws when no fallback plan is configured and the customer has no active plan', async () => {
      const customer = await seedCustomer();
      const fixture = await prisma.plan.findFirstOrThrow({
        where: { isFallbackPlan: true },
      });
      await prisma.plan.update({
        where: { id: fixture.id },
        data: { isFallbackPlan: false },
      });

      try {
        await expect(
          service.getEffectivePolicyForCustomer(customer.id),
        ).rejects.toThrow('No fallback plan is configured for the system');
      } finally {
        await prisma.plan.update({
          where: { id: fixture.id },
          data: { isFallbackPlan: true },
        });
      }
    });
  });

  describe('getEffectiveEcardPolicyForCard (organisation boost)', () => {
    async function seedOrgWithCreatorPlan(creatorOverrides: PlanOverrides) {
      const creator = await seedCustomer('Org Creator');
      const creatorPlan = await seedPlan(creatorOverrides);
      await assignPlan(creator.id, creatorPlan.id);

      const organisation = await prisma.organisation.create({
        data: { name: 'Acme Inc', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);
      return organisation;
    }

    it('returns the personal policy unmodified when organisationId is null', async () => {
      const owner = await seedCustomer();
      const plan = await seedPlan({ maxEcards: 3 });
      await assignPlan(owner.id, plan.id);

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: null,
      });

      expect(effective.maxEcards).toBe(3);
    });

    it('ORs exchangeContactAccess from the org creator plan onto a linked card', async () => {
      const owner = await seedCustomer();
      const ownerPlan = await seedPlan({ ecardExchangeContactAccess: false });
      await assignPlan(owner.id, ownerPlan.id);

      const organisation = await seedOrgWithCreatorPlan({
        orgEcardExchangeContactAccess: true,
      });

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: organisation.id,
      });

      expect(effective.exchangeContactAccess).toBe(true);
    });

    it('MAXes numeric gallery caps between personal and org boost', async () => {
      const owner = await seedCustomer();
      const ownerPlan = await seedPlan({
        galleryLimits: {
          maxGalleries: 1,
          maxImagesPerGallery: 2,
          maxGallerySizeBytes: 100,
        },
      });
      await assignPlan(owner.id, ownerPlan.id);

      const organisation = await seedOrgWithCreatorPlan({
        orgGalleryLimits: {
          maxGalleries: 9,
          maxImagesPerGallery: 20,
          maxGallerySizeBytes: 999,
        },
      });

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: organisation.id,
      });

      expect(effective.galleryLimits).toEqual({
        maxGalleries: 9,
        maxImagesPerGallery: 20,
        maxGallerySizeBytes: 999,
      });
    });

    it('never boosts maxEcards even when the org grants a higher value', async () => {
      const owner = await seedCustomer();
      const ownerPlan = await seedPlan({ maxEcards: 1 });
      await assignPlan(owner.id, ownerPlan.id);

      const organisation = await seedOrgWithCreatorPlan({ maxEcards: 999 });

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: organisation.id,
      });

      expect(effective.maxEcards).toBe(1);
    });

    it('ORs isCustomFormAvailable from the org creator plan onto a linked card', async () => {
      const owner = await seedCustomer();
      const ownerPlan = await seedPlan({ customFormIsAvailable: false });
      await assignPlan(owner.id, ownerPlan.id);

      const organisation = await seedOrgWithCreatorPlan({
        orgCustomFormIsAvailable: true,
      });

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: organisation.id,
      });

      expect(effective.isCustomFormAvailable).toBe(true);
    });

    it('never boosts maxCustomForms even when the org grants a higher value', async () => {
      const owner = await seedCustomer();
      const ownerPlan = await seedPlan({ maxCustomForms: 1 });
      await assignPlan(owner.id, ownerPlan.id);

      const organisation = await seedOrgWithCreatorPlan({
        maxCustomForms: 999,
      });

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: organisation.id,
      });

      expect(effective.maxCustomForms).toBe(1);
    });

    it('never revokes a personally-granted capability the org policy lacks', async () => {
      const owner = await seedCustomer();
      const ownerPlan = await seedPlan({
        componentAvailability: { [ECardComponentType.GALLERY]: true },
      });
      await assignPlan(owner.id, ownerPlan.id);

      const organisation = await seedOrgWithCreatorPlan({
        orgEcardComponentAvailability: {
          [ECardComponentType.GALLERY]: false,
        },
      });

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: organisation.id,
      });

      expect(effective.components[ECardComponentType.GALLERY]).toBe(true);
    });

    it('degrades to a no-op boost when the organisation has no resolvable creator', async () => {
      const owner = await seedCustomer();
      const ownerPlan = await seedPlan({ ecardExchangeContactAccess: false });
      await assignPlan(owner.id, ownerPlan.id);

      const organisation = await prisma.organisation.create({
        data: { name: 'Orphaned Org', createdByCustomerId: null },
      });
      seededOrganisationIds.push(organisation.id);

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: organisation.id,
      });

      expect(effective.exchangeContactAccess).toBe(false);
    });

    it('MAXes numeric video gallery caps between personal and org boost', async () => {
      const owner = await seedCustomer();
      const ownerPlan = await seedPlan({
        videoGalleryLimits: { maxVideoGalleries: 1, maxVideosPerGallery: 2 },
      });
      await assignPlan(owner.id, ownerPlan.id);

      const organisation = await seedOrgWithCreatorPlan({
        orgVideoGalleryLimits: {
          maxVideoGalleries: 9,
          maxVideosPerGallery: 20,
        },
      });

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: organisation.id,
      });

      expect(effective.videoGalleryLimits).toEqual({
        maxVideoGalleries: 9,
        maxVideosPerGallery: 20,
      });
    });
  });

  describe('videoGalleryLimits resolution', () => {
    it('defaults to zero limits when no videoGalleryLimits row exists for the VIDEO_GALLERY component', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan();
      await assignPlan(customer.id, plan.id);

      await prisma.videoGalleryComponentLimits.deleteMany({
        where: {
          ecardComponentAvailability: {
            type: ECardComponentType.VIDEO_GALLERY,
            ecardPolicy: { planPolicy: { planId: plan.id } },
          },
        },
      });

      const effective = await service.getEffectivePolicyForCustomer(
        customer.id,
      );

      expect(effective.ecard.videoGalleryLimits).toEqual({
        maxVideoGalleries: 0,
        maxVideosPerGallery: 0,
      });
    });

    it('populates videoGalleryLimits correctly from a stored row', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        videoGalleryLimits: { maxVideoGalleries: 7, maxVideosPerGallery: 15 },
      });
      await assignPlan(customer.id, plan.id);

      const effective = await service.getEffectivePolicyForCustomer(
        customer.id,
      );

      expect(effective.ecard.videoGalleryLimits).toEqual({
        maxVideoGalleries: 7,
        maxVideosPerGallery: 15,
      });
    });
  });

  describe('heroLayouts resolution', () => {
    it('DEFAULT is always true, gated layouts default false with no stored rows', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan();
      await assignPlan(customer.id, plan.id);

      const effective = await service.getEffectivePolicyForCustomer(
        customer.id,
      );

      expect(effective.ecard.heroLayouts).toEqual({
        [ECardHeroLayout.DEFAULT]: true,
        [ECardHeroLayout.BANNER]: false,
        [ECardHeroLayout.BANNER_PROFILE]: false,
        [ECardHeroLayout.ORG_BADGE]: false,
      });
    });

    it('reflects an explicitly-granted gated layout', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        heroLayoutAvailability: { [ECardHeroLayout.BANNER]: true },
      });
      await assignPlan(customer.id, plan.id);

      const effective = await service.getEffectivePolicyForCustomer(
        customer.id,
      );

      expect(effective.ecard.heroLayouts[ECardHeroLayout.BANNER]).toBe(true);
      expect(effective.ecard.heroLayouts[ECardHeroLayout.BANNER_PROFILE]).toBe(
        false,
      );
    });

    it("ORs a layout granted only via the organisation's boost", async () => {
      const owner = await seedCustomer();
      const ownerPlan = await seedPlan();
      await assignPlan(owner.id, ownerPlan.id);

      const creator = await seedCustomer('Org Creator');
      const creatorPlan = await seedPlan({
        orgHeroLayoutAvailability: { [ECardHeroLayout.ORG_BADGE]: true },
      });
      await assignPlan(creator.id, creatorPlan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme Inc', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: organisation.id,
      });

      expect(effective.heroLayouts[ECardHeroLayout.ORG_BADGE]).toBe(true);
      expect(effective.heroLayouts[ECardHeroLayout.BANNER]).toBe(false);
    });
  });

  describe('themes / iconShapes / accentColor resolution', () => {
    it('DEFAULT_DARK and CIRCLE are always true, gated values default false with no stored rows', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan();
      await assignPlan(customer.id, plan.id);

      const effective = await service.getEffectivePolicyForCustomer(
        customer.id,
      );

      expect(effective.ecard.themes).toEqual({
        [ECardTheme.DEFAULT_DARK]: true,
        [ECardTheme.LIGHT]: false,
        [ECardTheme.NAVY_TEAL]: false,
      });
      expect(effective.ecard.iconShapes).toEqual({
        [ECardIconShape.CIRCLE]: true,
        [ECardIconShape.SQUIRCLE]: false,
        [ECardIconShape.ROUNDED_SQUARE]: false,
        [ECardIconShape.TEARDROP]: false,
      });
      expect(effective.ecard.accentColorCustomizationAvailable).toBe(false);
      expect(effective.ecard.accentColorPresets).toEqual([]);
    });

    it('reflects an explicitly-granted gated theme, icon shape, and accent-color toggle', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        themeAvailability: { [ECardTheme.LIGHT]: true },
        iconShapeAvailability: { [ECardIconShape.TEARDROP]: true },
        accentColorCustomizationAvailable: true,
      });
      await assignPlan(customer.id, plan.id);

      const effective = await service.getEffectivePolicyForCustomer(
        customer.id,
      );

      expect(effective.ecard.themes[ECardTheme.LIGHT]).toBe(true);
      expect(effective.ecard.themes[ECardTheme.NAVY_TEAL]).toBe(false);
      expect(effective.ecard.iconShapes[ECardIconShape.TEARDROP]).toBe(true);
      expect(effective.ecard.iconShapes[ECardIconShape.SQUIRCLE]).toBe(false);
      expect(effective.ecard.accentColorCustomizationAvailable).toBe(true);
    });

    it('reflects stored accent-color presets', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        accentColorPresets: [
          {
            themeAffinity: ECardAccentColorPresetThemeAffinity.DARK,
            primaryColor: '#111111',
            secondaryColor: '#222222',
          },
        ],
      });
      await assignPlan(customer.id, plan.id);

      const effective = await service.getEffectivePolicyForCustomer(
        customer.id,
      );

      expect(effective.ecard.accentColorPresets).toEqual([
        {
          themeAffinity: ECardAccentColorPresetThemeAffinity.DARK,
          primaryColor: '#111111',
          secondaryColor: '#222222',
        },
      ]);
    });

    it("ORs a theme, icon shape, and accent-color toggle granted only via the organisation's boost", async () => {
      const owner = await seedCustomer();
      const ownerPlan = await seedPlan();
      await assignPlan(owner.id, ownerPlan.id);

      const creator = await seedCustomer('Org Creator');
      const creatorPlan = await seedPlan({
        orgThemeAvailability: { [ECardTheme.NAVY_TEAL]: true },
        orgIconShapeAvailability: { [ECardIconShape.ROUNDED_SQUARE]: true },
        orgAccentColorCustomizationAvailable: true,
      });
      await assignPlan(creator.id, creatorPlan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme Inc', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: organisation.id,
      });

      expect(effective.themes[ECardTheme.NAVY_TEAL]).toBe(true);
      expect(effective.themes[ECardTheme.LIGHT]).toBe(false);
      expect(effective.iconShapes[ECardIconShape.ROUNDED_SQUARE]).toBe(true);
      expect(effective.accentColorCustomizationAvailable).toBe(true);
    });

    it('union-merges accent-color presets from the personal plan and the org boost without duplicating shared ones', async () => {
      const sharedPreset = {
        themeAffinity: ECardAccentColorPresetThemeAffinity.DARK,
        primaryColor: '#111111',
        secondaryColor: '#222222',
      };
      const personalOnlyPreset = {
        themeAffinity: ECardAccentColorPresetThemeAffinity.LIGHT,
        primaryColor: '#333333',
        secondaryColor: '#444444',
      };
      const orgOnlyPreset = {
        themeAffinity: ECardAccentColorPresetThemeAffinity.DARK,
        primaryColor: '#555555',
        secondaryColor: '#666666',
      };

      const owner = await seedCustomer();
      const ownerPlan = await seedPlan({
        accentColorPresets: [sharedPreset, personalOnlyPreset],
      });
      await assignPlan(owner.id, ownerPlan.id);

      const creator = await seedCustomer('Org Creator');
      const creatorPlan = await seedPlan({
        orgAccentColorPresets: [sharedPreset, orgOnlyPreset],
      });
      await assignPlan(creator.id, creatorPlan.id);
      const organisation = await prisma.organisation.create({
        data: { name: 'Acme Inc', createdByCustomerId: creator.id },
      });
      seededOrganisationIds.push(organisation.id);

      const effective = await service.getEffectiveEcardPolicyForCard({
        customerId: owner.id,
        organisationId: organisation.id,
      });

      expect(effective.accentColorPresets).toHaveLength(3);
      expect(effective.accentColorPresets).toEqual(
        expect.arrayContaining([
          sharedPreset,
          personalOnlyPreset,
          orgOnlyPreset,
        ]),
      );
    });
  });

  describe('getEffectiveSmartCardPolicy', () => {
    it('returns null for an unclaimed smart card (no customerId)', async () => {
      const effective = await service.getEffectiveSmartCardPolicy({
        customerId: null,
      });
      expect(effective).toBeNull();
    });

    it("returns the customer's smart card policy otherwise", async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({ maxSmartCards: 5 });
      await assignPlan(customer.id, plan.id);

      const effective = await service.getEffectiveSmartCardPolicy({
        customerId: customer.id,
      });

      expect(effective?.maxSmartCards).toBe(5);
    });
  });

  describe('getLeadCaptureAccess / getLeadViewAccess', () => {
    it('reports both sources false and no view access when nothing grants it', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        ecardExchangeContactAccess: false,
        smartCardExchangeContactAccess: false,
      });
      await assignPlan(customer.id, plan.id);

      const access = await service.getLeadCaptureAccess(customer.id);
      expect(access).toEqual({ ecard: false, smartCard: false });
      await expect(service.getLeadViewAccess(customer.id)).resolves.toBe(false);
    });

    it('grants view access when either source is true', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        ecardExchangeContactAccess: true,
        smartCardExchangeContactAccess: false,
      });
      await assignPlan(customer.id, plan.id);

      await expect(service.getLeadViewAccess(customer.id)).resolves.toBe(true);
    });

    it('grants view access when the customer already has a captured lead, even with both sources false', async () => {
      const customer = await seedCustomer();
      const plan = await seedPlan({
        ecardExchangeContactAccess: false,
        smartCardExchangeContactAccess: false,
      });
      await assignPlan(customer.id, plan.id);
      await prisma.lead.create({
        data: { customerId: customer.id, name: 'Existing Lead' },
      });

      await expect(service.getLeadViewAccess(customer.id)).resolves.toBe(true);
    });
  });
});
