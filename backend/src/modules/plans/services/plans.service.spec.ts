import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ECardComponentType,
  PlanBusinessModelType,
} from '../../../generated/prisma/client';
import type { CreatePlanDto } from '../dto/create-plan.dto';
import type { EcardPolicyDto } from '../dto/ecard-policy.dto';
import type { EventPolicyDto } from '../dto/event-policy.dto';
import type { SmartCardPolicyDto } from '../dto/smart-card-policy.dto';
import { PlansService } from './plans.service';

describe('PlansService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: PlansService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededPlanIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new PlansService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
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
      await prisma.plan
        .deleteMany({ where: { id: { in: seededPlanIds } } })
        .catch(() => undefined);
      seededPlanIds.length = 0;
    }
  });

  function buildEcardPolicyDto(
    overrides: Partial<EcardPolicyDto> = {},
  ): EcardPolicyDto {
    return {
      isAvailable: true,
      maxEcards: 3,
      exchangeContactAccess: false,
      componentAvailabilities: Object.values(ECardComponentType).map(
        (type) => ({
          type,
          isAvailable: true,
          ...(type === ECardComponentType.GALLERY && {
            galleryLimits: {
              maxGalleries: 2,
              maxImagesPerGallery: 5,
              maxGallerySizeBytes: 1024,
            },
          }),
        }),
      ),
      ...overrides,
    };
  }

  function buildSmartCardPolicyDto(
    overrides: Partial<SmartCardPolicyDto> = {},
  ): SmartCardPolicyDto {
    return {
      isAvailable: true,
      maxSmartCards: 2,
      exchangeContactAccess: false,
      whitelistedTemplateIds: [],
      ...overrides,
    };
  }

  function buildEventPolicyDto(
    overrides: Partial<EventPolicyDto> = {},
  ): EventPolicyDto {
    return {
      isAvailable: true,
      maxEvents: 2,
      maxGuestsPerEvent: 10,
      ...overrides,
    };
  }

  function buildCreatePlanDto(
    overrides: Partial<CreatePlanDto> = {},
  ): CreatePlanDto {
    return {
      name: `Test Plan ${randomUUID()}`,
      price: 100,
      businessModelType: PlanBusinessModelType.ONE_TIME,
      isPublic: false,
      ecardPolicy: buildEcardPolicyDto(),
      smartCardPolicy: buildSmartCardPolicyDto(),
      organisationPolicy: {
        isAvailable: true,
        maxOrgsCanJoin: 1,
        maxOrgsCanCreate: 1,
        orgEcardPolicy: buildEcardPolicyDto({ maxEcards: 0 }),
        orgSmartCardPolicy: buildSmartCardPolicyDto({ maxSmartCards: 0 }),
      },
      eventPolicy: buildEventPolicyDto(),
      ...overrides,
    };
  }

  async function createPlan(overrides: Partial<CreatePlanDto> = {}) {
    const plan = await service.create(buildCreatePlanDto(overrides));
    seededPlanIds.push(plan.id);
    return plan;
  }

  async function seedCustomer(name = 'Test Customer') {
    const account = await prisma.customerAccount.create({
      data: {
        name,
        email: `plans-service-${randomUUID()}@example.com`,
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
        email: `plans-service-employee-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'admin',
      },
    });
    seededEmployeeAccountIds.push(account.id);
    return prisma.employee.create({ data: { accountId: account.id } });
  }

  describe('create / getByIdOrThrow', () => {
    it('creates a plan with a fully populated nested policy tree', async () => {
      const plan = await createPlan({
        name: 'Premium Plan',
        ecardPolicy: buildEcardPolicyDto({ maxEcards: 5 }),
      });

      expect(plan.name).toBe('Premium Plan');
      expect(plan.ecardPolicy.maxEcards).toBe(5);
      expect(plan.ecardPolicy.componentAvailabilities).toHaveLength(
        Object.values(ECardComponentType).length,
      );
      const gallery = plan.ecardPolicy.componentAvailabilities.find(
        (c) => c.type === ECardComponentType.GALLERY,
      );
      expect(gallery?.galleryLimits).toEqual({
        maxGalleries: 2,
        maxImagesPerGallery: 5,
        maxGallerySizeBytes: 1024,
      });
    });

    it('requires subscriptionDurationMonths to round-trip for SUBSCRIPTION plans', async () => {
      const plan = await createPlan({
        businessModelType: PlanBusinessModelType.SUBSCRIPTION,
        subscriptionDurationMonths: 6,
      });
      expect(plan.subscriptionDurationMonths).toBe(6);
    });

    it('throws when the plan does not exist', async () => {
      await expect(service.getByIdOrThrow(randomUUID())).rejects.toThrow(
        'Plan not found',
      );
    });
  });

  describe('list', () => {
    it('filters by name search, case-insensitively', async () => {
      await createPlan({ name: `Findable-${randomUUID()}` });
      await createPlan({ name: `Other-${randomUUID()}` });

      const result = await service.list({
        search: 'findable',
        page: 1,
        pageSize: 20,
      });

      expect(result.plans.length).toBeGreaterThanOrEqual(1);
      expect(
        result.plans.every((p) => p.name.toLowerCase().includes('findable')),
      ).toBe(true);
    });
  });

  describe('update', () => {
    it('updates top-level fields', async () => {
      const plan = await createPlan({ name: 'Original Name', price: 50 });

      const updated = await service.update(plan.id, { name: 'New Name' });
      expect(updated.name).toBe('New Name');
      expect(updated.price).toBe(50);
    });

    it('nulls subscriptionDurationMonths when switching away from SUBSCRIPTION', async () => {
      const plan = await createPlan({
        businessModelType: PlanBusinessModelType.SUBSCRIPTION,
        subscriptionDurationMonths: 12,
      });

      const updated = await service.update(plan.id, {
        businessModelType: PlanBusinessModelType.ONE_TIME,
      });
      expect(updated.subscriptionDurationMonths).toBeNull();
    });

    it('fully replaces the e-card policy, including component availabilities', async () => {
      const plan = await createPlan();

      const updated = await service.update(plan.id, {
        ecardPolicy: buildEcardPolicyDto({
          maxEcards: 99,
          componentAvailabilities: Object.values(ECardComponentType).map(
            (type) => ({
              type,
              isAvailable: type !== ECardComponentType.WHATSAPP,
              ...(type === ECardComponentType.GALLERY && {
                galleryLimits: {
                  maxGalleries: 1,
                  maxImagesPerGallery: 1,
                  maxGallerySizeBytes: 1,
                },
              }),
            }),
          ),
        }),
      });

      expect(updated.ecardPolicy.maxEcards).toBe(99);
      const whatsapp = updated.ecardPolicy.componentAvailabilities.find(
        (c) => c.type === ECardComponentType.WHATSAPP,
      );
      expect(whatsapp?.isAvailable).toBe(false);
    });

    it('replaces the organisation policy bundle', async () => {
      const plan = await createPlan();

      const updated = await service.update(plan.id, {
        organisationPolicy: {
          isAvailable: false,
          maxOrgsCanJoin: 7,
          maxOrgsCanCreate: 7,
          orgEcardPolicy: buildEcardPolicyDto({
            exchangeContactAccess: true,
          }),
          orgSmartCardPolicy: buildSmartCardPolicyDto(),
        },
      });

      expect(updated.organisationPolicy.isAvailable).toBe(false);
      expect(updated.organisationPolicy.maxOrgsCanJoin).toBe(7);
      expect(
        updated.organisationPolicy.orgEcardPolicy.exchangeContactAccess,
      ).toBe(true);
    });

    it('replaces the event policy', async () => {
      const plan = await createPlan();

      const updated = await service.update(plan.id, {
        eventPolicy: buildEventPolicyDto({
          isAvailable: false,
          maxEvents: 9,
          maxGuestsPerEvent: 99,
        }),
      });

      expect(updated.eventPolicy).toEqual({
        isAvailable: false,
        maxEvents: 9,
        maxGuestsPerEvent: 99,
      });
    });

    it('throws when the plan does not exist', async () => {
      await expect(
        service.update(randomUUID(), { name: 'Anything' }),
      ).rejects.toThrow('Plan not found');
    });
  });

  describe('setFallbackPlan', () => {
    // A permanent, generous fallback fixture already exists in
    // TEST_DATABASE_URL (seeded by the "pretest" script). setFallbackPlan
    // unconditionally steals the flag from whichever plan currently holds
    // it, so these tests must clear it off whatever they set it to and
    // restore the fixture as fallback again afterward — safe under Jest's
    // maxWorkers: 1 (serial test-file execution).
    it('unsets any previous fallback plan when setting a new one', async () => {
      const fixture = await prisma.plan.findFirstOrThrow({
        where: { isFallbackPlan: true },
      });
      const first = await createPlan();
      const second = await createPlan();

      try {
        await service.setFallbackPlan(first.id);
        let refreshedFirst = await service.getByIdOrThrow(first.id);
        expect(refreshedFirst.isFallbackPlan).toBe(true);

        await service.setFallbackPlan(second.id);
        refreshedFirst = await service.getByIdOrThrow(first.id);
        const refreshedSecond = await service.getByIdOrThrow(second.id);
        expect(refreshedFirst.isFallbackPlan).toBe(false);
        expect(refreshedSecond.isFallbackPlan).toBe(true);
      } finally {
        await prisma.plan.update({
          where: { id: second.id },
          data: { isFallbackPlan: false },
        });
        await prisma.plan.update({
          where: { id: fixture.id },
          data: { isFallbackPlan: true },
        });
      }
    });
  });

  describe('remove (orphan-only delete guard)', () => {
    it('deletes a plan with no linked data', async () => {
      const plan = await createPlan();

      await service.remove(plan.id);
      const index = seededPlanIds.indexOf(plan.id);
      if (index !== -1) {
        seededPlanIds.splice(index, 1);
      }

      await expect(
        prisma.plan.findUnique({ where: { id: plan.id } }),
      ).resolves.toBeNull();
    });

    it('blocks deleting a plan referenced by purchase history', async () => {
      const plan = await createPlan();
      const customer = await seedCustomer();
      const employee = await seedEmployee();
      await prisma.planPurchaseHistory.create({
        data: {
          customerId: customer.id,
          planId: plan.id,
          assignedByEmployeeId: employee.id,
          expiresAt: null,
          businessModelTypeAtPurchase: PlanBusinessModelType.ONE_TIME,
        },
      });

      await expect(service.remove(plan.id)).rejects.toThrow(
        'This plan cannot be deleted while it is still in use',
      );
    });

    it("blocks deleting a plan that is any customer's current plan", async () => {
      const plan = await createPlan();
      const customer = await seedCustomer();
      await prisma.customer.update({
        where: { id: customer.id },
        data: { currentPlanId: plan.id },
      });

      await expect(service.remove(plan.id)).rejects.toThrow(
        'This plan cannot be deleted while it is still in use',
      );
    });

    it('blocks deleting the fallback plan', async () => {
      const fixture = await prisma.plan.findFirstOrThrow({
        where: { isFallbackPlan: true },
      });
      const plan = await createPlan();

      try {
        await service.setFallbackPlan(plan.id);

        await expect(service.remove(plan.id)).rejects.toThrow(
          'This plan cannot be deleted while it is still in use',
        );
      } finally {
        await prisma.plan.update({
          where: { id: plan.id },
          data: { isFallbackPlan: false },
        });
        await prisma.plan.update({
          where: { id: fixture.id },
          data: { isFallbackPlan: true },
        });
      }
    });

    it('throws when the plan does not exist', async () => {
      await expect(service.remove(randomUUID())).rejects.toThrow(
        'Plan not found',
      );
    });
  });
});
