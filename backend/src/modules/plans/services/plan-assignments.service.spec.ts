import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PlanBusinessModelType } from '../../../generated/prisma/client';
import { PlanAssignmentsService } from './plan-assignments.service';

describe('PlanAssignmentsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: PlanAssignmentsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededPlanIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new PlanAssignmentsService(prisma);
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
      await prisma.plan.deleteMany({ where: { id: { in: seededPlanIds } } });
      seededPlanIds.length = 0;
    }
  });

  async function seedCustomer(name = 'Test Customer') {
    const account = await prisma.customerAccount.create({
      data: {
        name,
        email: `plan-assignments-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedEmployee() {
    const account = await prisma.employeeAccount.create({
      data: {
        name: 'Assigning Employee',
        email: `plan-assignments-employee-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'admin',
      },
    });
    seededEmployeeAccountIds.push(account.id);
    const employee = await prisma.employee.create({
      data: { accountId: account.id },
    });
    return { accountId: account.id, employeeId: employee.id };
  }

  async function seedBarePlan(
    overrides: Partial<{
      businessModelType: PlanBusinessModelType;
      subscriptionDurationMonths: number | null;
    }> = {},
  ) {
    const plan = await prisma.plan.create({
      data: {
        name: `Test Plan ${randomUUID()}`,
        price: 0,
        businessModelType:
          overrides.businessModelType ?? PlanBusinessModelType.ONE_TIME,
        subscriptionDurationMonths:
          overrides.subscriptionDurationMonths ?? null,
      },
    });
    seededPlanIds.push(plan.id);
    return plan;
  }

  describe('assign', () => {
    it('sets currentPlanId and writes a history row with a null expiresAt for a ONE_TIME plan', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();
      const plan = await seedBarePlan();

      await service.assign(customer.id, plan.id, employee.accountId);

      const updated = await prisma.customer.findUniqueOrThrow({
        where: { id: customer.id },
      });
      expect(updated.currentPlanId).toBe(plan.id);

      const history = await prisma.planPurchaseHistory.findFirst({
        where: { customerId: customer.id, planId: plan.id },
      });
      expect(history?.expiresAt).toBeNull();
      expect(history?.businessModelTypeAtPurchase).toBe('ONE_TIME');
      expect(history?.assignedByEmployeeId).toBe(employee.employeeId);
    });

    it('computes a future expiresAt for a SUBSCRIPTION plan', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();
      const plan = await seedBarePlan({
        businessModelType: PlanBusinessModelType.SUBSCRIPTION,
        subscriptionDurationMonths: 3,
      });

      await service.assign(customer.id, plan.id, employee.accountId);

      const history = await prisma.planPurchaseHistory.findFirst({
        where: { customerId: customer.id, planId: plan.id },
      });
      expect(history?.expiresAt).not.toBeNull();
      expect(history!.expiresAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('blocks assigning when the customer already has an active plan', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();
      const planA = await seedBarePlan();
      const planB = await seedBarePlan();
      await service.assign(customer.id, planA.id, employee.accountId);

      await expect(
        service.assign(customer.id, planB.id, employee.accountId),
      ).rejects.toThrow(
        'This customer already has an active plan — use switch instead',
      );
    });

    it('blocks assigning the same TRIAL plan to a customer twice', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();
      const trialPlan = await seedBarePlan({
        businessModelType: PlanBusinessModelType.TRIAL,
      });

      await service.assign(customer.id, trialPlan.id, employee.accountId);
      await service.cancel(customer.id);

      await expect(
        service.assign(customer.id, trialPlan.id, employee.accountId),
      ).rejects.toThrow('This customer has already used this trial plan');
    });

    it('allows assigning a different TRIAL plan after using one already', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();
      const firstTrial = await seedBarePlan({
        businessModelType: PlanBusinessModelType.TRIAL,
      });
      const secondTrial = await seedBarePlan({
        businessModelType: PlanBusinessModelType.TRIAL,
      });

      await service.assign(customer.id, firstTrial.id, employee.accountId);
      await service.cancel(customer.id);

      await expect(
        service.assign(customer.id, secondTrial.id, employee.accountId),
      ).resolves.toBeUndefined();
    });

    it('throws when the plan does not exist', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();

      await expect(
        service.assign(customer.id, randomUUID(), employee.accountId),
      ).rejects.toThrow('Plan not found');
    });
  });

  describe('switchPlan', () => {
    it('blocks switching when the customer has no active plan', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();
      const plan = await seedBarePlan();

      await expect(
        service.switchPlan(customer.id, plan.id, employee.accountId),
      ).rejects.toThrow(
        'This customer has no active plan to switch — use assign instead',
      );
    });

    it('replaces the active plan and records both events in history', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();
      const planA = await seedBarePlan();
      const planB = await seedBarePlan();

      await service.assign(customer.id, planA.id, employee.accountId);
      await service.switchPlan(customer.id, planB.id, employee.accountId);

      const updated = await prisma.customer.findUniqueOrThrow({
        where: { id: customer.id },
      });
      expect(updated.currentPlanId).toBe(planB.id);

      const historyForA = await prisma.planPurchaseHistory.findFirst({
        where: { customerId: customer.id, planId: planA.id },
      });
      const historyForB = await prisma.planPurchaseHistory.findFirst({
        where: { customerId: customer.id, planId: planB.id },
      });
      expect(historyForA).not.toBeNull();
      expect(historyForB).not.toBeNull();
    });
  });

  describe('bulkAssign', () => {
    it('assigns every customer and writes one history row each', async () => {
      const employee = await seedEmployee();
      const plan = await seedBarePlan();
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const customerC = await seedCustomer();

      const result = await service.bulkAssign(
        plan.id,
        [customerA.id, customerB.id, customerC.id],
        employee.accountId,
      );

      expect(result).toEqual({ assignedCount: 3 });
      for (const customer of [customerA, customerB, customerC]) {
        const updated = await prisma.customer.findUniqueOrThrow({
          where: { id: customer.id },
        });
        expect(updated.currentPlanId).toBe(plan.id);
        const history = await prisma.planPurchaseHistory.findFirst({
          where: { customerId: customer.id, planId: plan.id },
        });
        expect(history?.assignedByEmployeeId).toBe(employee.employeeId);
      }
    });

    it('computes a future expiresAt for a SUBSCRIPTION plan for every assigned customer', async () => {
      const employee = await seedEmployee();
      const plan = await seedBarePlan({
        businessModelType: PlanBusinessModelType.SUBSCRIPTION,
        subscriptionDurationMonths: 6,
      });
      const customer = await seedCustomer();

      await service.bulkAssign(plan.id, [customer.id], employee.accountId);

      const history = await prisma.planPurchaseHistory.findFirst({
        where: { customerId: customer.id, planId: plan.id },
      });
      expect(history?.expiresAt).not.toBeNull();
      expect(history!.expiresAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('overwrites a customer who already has a different active plan, with no conflict', async () => {
      const employee = await seedEmployee();
      const oldPlan = await seedBarePlan();
      const newPlan = await seedBarePlan();
      const customer = await seedCustomer();
      await service.assign(customer.id, oldPlan.id, employee.accountId);

      await expect(
        service.bulkAssign(newPlan.id, [customer.id], employee.accountId),
      ).resolves.toEqual({ assignedCount: 1 });

      const updated = await prisma.customer.findUniqueOrThrow({
        where: { id: customer.id },
      });
      expect(updated.currentPlanId).toBe(newPlan.id);
    });

    it('dedupes a customerId repeated in the input to a single assignment', async () => {
      const employee = await seedEmployee();
      const plan = await seedBarePlan();
      const customer = await seedCustomer();

      const result = await service.bulkAssign(
        plan.id,
        [customer.id, customer.id],
        employee.accountId,
      );

      expect(result).toEqual({ assignedCount: 1 });
      const historyCount = await prisma.planPurchaseHistory.count({
        where: { customerId: customer.id, planId: plan.id },
      });
      expect(historyCount).toBe(1);
    });

    it('throws and applies nothing when one customerId does not exist', async () => {
      const employee = await seedEmployee();
      const plan = await seedBarePlan();
      const customer = await seedCustomer();

      await expect(
        service.bulkAssign(
          plan.id,
          [customer.id, randomUUID()],
          employee.accountId,
        ),
      ).rejects.toThrow(
        'One or more customerIds do not reference an existing customer',
      );

      const updated = await prisma.customer.findUniqueOrThrow({
        where: { id: customer.id },
      });
      expect(updated.currentPlanId).toBeNull();
    });

    it('throws and applies nothing when any customer in the batch already used this TRIAL plan', async () => {
      const employee = await seedEmployee();
      const trialPlan = await seedBarePlan({
        businessModelType: PlanBusinessModelType.TRIAL,
      });
      const usedCustomer = await seedCustomer();
      const freshCustomer = await seedCustomer();
      await service.assign(usedCustomer.id, trialPlan.id, employee.accountId);
      await service.cancel(usedCustomer.id);

      await expect(
        service.bulkAssign(
          trialPlan.id,
          [freshCustomer.id, usedCustomer.id],
          employee.accountId,
        ),
      ).rejects.toThrow('This customer has already used this trial plan');

      const updated = await prisma.customer.findUniqueOrThrow({
        where: { id: freshCustomer.id },
      });
      expect(updated.currentPlanId).toBeNull();
    });

    it('throws when the plan does not exist', async () => {
      const employee = await seedEmployee();
      const customer = await seedCustomer();

      await expect(
        service.bulkAssign(randomUUID(), [customer.id], employee.accountId),
      ).rejects.toThrow('Plan not found');
    });
  });

  describe('renew', () => {
    it('blocks renewing when the customer has no active plan', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();

      await expect(
        service.renew(customer.id, employee.accountId),
      ).rejects.toThrow('This customer has no active plan to renew');
    });

    it('creates a new history row for the same plan rather than mutating the old one', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();
      const plan = await seedBarePlan({
        businessModelType: PlanBusinessModelType.SUBSCRIPTION,
        subscriptionDurationMonths: 1,
      });

      await service.assign(customer.id, plan.id, employee.accountId);
      const historyCountBefore = await prisma.planPurchaseHistory.count({
        where: { customerId: customer.id, planId: plan.id },
      });

      await service.renew(customer.id, employee.accountId);

      const historyCountAfter = await prisma.planPurchaseHistory.count({
        where: { customerId: customer.id, planId: plan.id },
      });
      expect(historyCountAfter).toBe(historyCountBefore + 1);

      const updated = await prisma.customer.findUniqueOrThrow({
        where: { id: customer.id },
      });
      expect(updated.currentPlanId).toBe(plan.id);
    });
  });

  describe('cancel', () => {
    it('immediately clears currentPlanId with no grace period', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();
      const plan = await seedBarePlan();
      await service.assign(customer.id, plan.id, employee.accountId);

      await service.cancel(customer.id);

      const updated = await prisma.customer.findUniqueOrThrow({
        where: { id: customer.id },
      });
      expect(updated.currentPlanId).toBeNull();
    });
  });

  describe('listPurchaseHistory', () => {
    it('returns every assignment, most recent first, with the plan name resolved', async () => {
      const customer = await seedCustomer();
      const employee = await seedEmployee();
      const planA = await seedBarePlan();
      const planB = await seedBarePlan();
      await service.assign(customer.id, planA.id, employee.accountId);
      await service.cancel(customer.id);
      await service.assign(customer.id, planB.id, employee.accountId);

      const history = await service.listPurchaseHistory(customer.id);

      expect(history).toHaveLength(2);
      expect(history[0].planId).toBe(planB.id);
      expect(history[0].planName).toBe(planB.name);
      expect(history[0].assignedByEmployeeId).toBe(employee.employeeId);
      expect(history[1].planId).toBe(planA.id);
    });

    it('returns an empty array for a customer with no assignment history', async () => {
      const customer = await seedCustomer();
      await expect(service.listPurchaseHistory(customer.id)).resolves.toEqual(
        [],
      );
    });
  });
});
