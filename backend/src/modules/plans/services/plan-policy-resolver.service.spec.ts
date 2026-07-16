import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ECardComponentType,
  PlanBusinessModelType,
} from '../../../generated/prisma/client';
import { PlanPolicyResolverService } from './plan-policy-resolver.service';

interface PlanOverrides {
  isFallbackPlan?: boolean;
  maxEcards?: number;
  ecardExchangeContactAccess?: boolean;
  galleryLimits?: {
    maxGalleries: number;
    maxImagesPerGallery: number;
    maxGallerySizeBytes: number;
  };
  componentAvailability?: Partial<Record<ECardComponentType, boolean>>;
  maxSmartCards?: number;
  smartCardExchangeContactAccess?: boolean;
  orgIsAvailable?: boolean;
  maxOrgsCanJoin?: number;
  maxOrgsCanCreate?: number;
  orgEcardExchangeContactAccess?: boolean;
  orgEcardComponentAvailability?: Partial<Record<ECardComponentType, boolean>>;
  orgGalleryLimits?: {
    maxGalleries: number;
    maxImagesPerGallery: number;
    maxGallerySizeBytes: number;
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

    return {
      isAvailable: true,
      maxEcards: overrides.maxEcards ?? 3,
      exchangeContactAccess: isOrgBundle
        ? (overrides.orgEcardExchangeContactAccess ?? false)
        : (overrides.ecardExchangeContactAccess ?? false),
      componentAvailabilities: {
        create: Object.values(ECardComponentType).map((type) => ({
          type,
          isAvailable: availabilityOverrides?.[type] ?? true,
          ...(type === ECardComponentType.GALLERY && {
            galleryLimits: { create: limits },
          }),
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
