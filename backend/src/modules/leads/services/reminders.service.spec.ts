import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ReminderStatus } from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { LeadsService } from './leads.service';
import { RemindersService } from './reminders.service';

describe('RemindersService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let leadsService: LeadsService;
  let service: RemindersService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    leadsService = new LeadsService(
      prisma,
      new PlanEnforcementService(prisma, new PlanPolicyResolverService(prisma)),
    );
    service = new RemindersService(prisma, leadsService);
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
  });

  async function seedCustomer() {
    const account = await prisma.customerAccount.create({
      data: {
        name: 'Test Customer',
        email: `reminders-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  describe('create', () => {
    it('creates a reminder defaulting to PENDING status', async () => {
      const customer = await seedCustomer();
      const lead = await leadsService.create(customer.id, { name: 'Lead' });
      const triggerAt = new Date(Date.now() + 60_000);

      const reminder = await service.create(customer.id, lead.id, {
        title: 'Follow up',
        triggerAt,
      });

      expect(reminder.leadId).toBe(lead.id);
      expect(reminder.title).toBe('Follow up');
      expect(reminder.text).toBeNull();
      expect(reminder.status).toBe(ReminderStatus.PENDING);
      expect(reminder.triggerAt).toEqual(triggerAt);
    });

    it('throws NotFoundException when the lead is not owned by the customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const lead = await leadsService.create(customerA.id, { name: 'Lead' });

      await expect(
        service.create(customerB.id, lead.id, {
          title: 'Follow up',
          triggerAt: new Date(),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('returns reminders for the lead ordered by triggerAt ascending', async () => {
      const customer = await seedCustomer();
      const lead = await leadsService.create(customer.id, { name: 'Lead' });
      const later = await service.create(customer.id, lead.id, {
        title: 'Later',
        triggerAt: new Date(Date.now() + 2 * 60_000),
      });
      const sooner = await service.create(customer.id, lead.id, {
        title: 'Sooner',
        triggerAt: new Date(Date.now() + 60_000),
      });

      const result = await service.list(customer.id, lead.id);

      expect(result.map((r) => r.id)).toEqual([sooner.id, later.id]);
    });

    it('throws NotFoundException when the lead is not owned by the customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const lead = await leadsService.create(customerA.id, { name: 'Lead' });

      await expect(service.list(customerB.id, lead.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates fields including status', async () => {
      const customer = await seedCustomer();
      const lead = await leadsService.create(customer.id, { name: 'Lead' });
      const reminder = await service.create(customer.id, lead.id, {
        title: 'Follow up',
        triggerAt: new Date(Date.now() + 60_000),
      });

      const updated = await service.update(customer.id, lead.id, reminder.id, {
        title: 'Follow up (updated)',
        status: ReminderStatus.DISMISSED,
      });

      expect(updated.title).toBe('Follow up (updated)');
      expect(updated.status).toBe(ReminderStatus.DISMISSED);
    });

    it('throws NotFoundException when the reminder belongs to a different lead', async () => {
      const customer = await seedCustomer();
      const leadA = await leadsService.create(customer.id, { name: 'A' });
      const leadB = await leadsService.create(customer.id, { name: 'B' });
      const reminder = await service.create(customer.id, leadA.id, {
        title: 'Reminder',
        triggerAt: new Date(),
      });

      await expect(
        service.update(customer.id, leadB.id, reminder.id, {
          title: 'Hijacked',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('removes the reminder', async () => {
      const customer = await seedCustomer();
      const lead = await leadsService.create(customer.id, { name: 'Lead' });
      const reminder = await service.create(customer.id, lead.id, {
        title: 'Reminder',
        triggerAt: new Date(),
      });

      await service.delete(customer.id, lead.id, reminder.id);

      const found = await prisma.leadReminder.findUnique({
        where: { id: reminder.id },
      });
      expect(found).toBeNull();
    });

    it('throws NotFoundException when the reminder belongs to a different lead', async () => {
      const customer = await seedCustomer();
      const leadA = await leadsService.create(customer.id, { name: 'A' });
      const leadB = await leadsService.create(customer.id, { name: 'B' });
      const reminder = await service.create(customer.id, leadA.id, {
        title: 'Reminder',
        triggerAt: new Date(),
      });

      await expect(
        service.delete(customer.id, leadB.id, reminder.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDue', () => {
    it('returns only PENDING reminders at or before the threshold', async () => {
      const customer = await seedCustomer();
      const lead = await leadsService.create(customer.id, { name: 'Lead' });
      const overdue = await service.create(customer.id, lead.id, {
        title: 'Overdue',
        triggerAt: new Date(Date.now() - 60_000),
      });
      const future = await service.create(customer.id, lead.id, {
        title: 'Future',
        triggerAt: new Date(Date.now() + 60 * 60_000),
      });
      const dismissedOverdue = await service.create(customer.id, lead.id, {
        title: 'Dismissed overdue',
        triggerAt: new Date(Date.now() - 60_000),
      });
      await service.update(customer.id, lead.id, dismissedOverdue.id, {
        status: ReminderStatus.DISMISSED,
      });

      const due = await service.getDue(customer.id, 0);

      expect(due.map((r) => r.id)).toEqual([overdue.id]);
      expect(due.map((r) => r.id)).not.toContain(future.id);
      expect(due.map((r) => r.id)).not.toContain(dismissedOverdue.id);
    });

    it('includes reminders within the look-ahead window', async () => {
      const customer = await seedCustomer();
      const lead = await leadsService.create(customer.id, { name: 'Lead' });
      const soon = await service.create(customer.id, lead.id, {
        title: 'Soon',
        triggerAt: new Date(Date.now() + 30 * 60_000),
      });

      const withoutWindow = await service.getDue(customer.id, 0);
      const withWindow = await service.getDue(customer.id, 60);

      expect(withoutWindow.map((r) => r.id)).not.toContain(soon.id);
      expect(withWindow.map((r) => r.id)).toContain(soon.id);
    });

    it('excludes reminders belonging to another customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const leadA = await leadsService.create(customerA.id, { name: 'A' });
      const leadB = await leadsService.create(customerB.id, { name: 'B' });
      await service.create(customerA.id, leadA.id, {
        title: 'A reminder',
        triggerAt: new Date(Date.now() - 60_000),
      });
      const reminderB = await service.create(customerB.id, leadB.id, {
        title: 'B reminder',
        triggerAt: new Date(Date.now() - 60_000),
      });

      const due = await service.getDue(customerB.id, 0);

      expect(due.map((r) => r.id)).toEqual([reminderB.id]);
    });
  });
});
