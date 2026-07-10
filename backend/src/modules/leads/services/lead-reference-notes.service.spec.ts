import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LeadsService } from './leads.service';
import { LeadReferenceNotesService } from './lead-reference-notes.service';

describe('LeadReferenceNotesService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let leadsService: LeadsService;
  let service: LeadReferenceNotesService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    leadsService = new LeadsService(prisma);
    service = new LeadReferenceNotesService(prisma, leadsService);
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
        email: `lead-reference-notes-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  describe('create', () => {
    it('creates a note attached to the lead', async () => {
      const customer = await seedCustomer();
      const lead = await leadsService.create(customer.id, { name: 'Lead' });

      const note = await service.create(customer.id, lead.id, {
        content: 'Called, will follow up next week',
      });

      expect(note.leadId).toBe(lead.id);
      expect(note.content).toBe('Called, will follow up next week');
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundException when the lead is not owned by the customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const lead = await leadsService.create(customerA.id, { name: 'Lead' });

      await expect(
        service.create(customerB.id, lead.id, { content: 'Note' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('returns notes for the lead ordered newest first', async () => {
      const customer = await seedCustomer();
      const lead = await leadsService.create(customer.id, { name: 'Lead' });
      const first = await service.create(customer.id, lead.id, {
        content: 'First',
      });
      const second = await service.create(customer.id, lead.id, {
        content: 'Second',
      });

      const result = await service.list(customer.id, lead.id);

      expect(result.map((note) => note.id)).toEqual([second.id, first.id]);
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
    it('updates the note content', async () => {
      const customer = await seedCustomer();
      const lead = await leadsService.create(customer.id, { name: 'Lead' });
      const note = await service.create(customer.id, lead.id, {
        content: 'Original',
      });

      const updated = await service.update(customer.id, lead.id, note.id, {
        content: 'Updated',
      });

      expect(updated.content).toBe('Updated');
    });

    it('throws NotFoundException when the note belongs to a different lead', async () => {
      const customer = await seedCustomer();
      const leadA = await leadsService.create(customer.id, { name: 'A' });
      const leadB = await leadsService.create(customer.id, { name: 'B' });
      const note = await service.create(customer.id, leadA.id, {
        content: 'Note',
      });

      await expect(
        service.update(customer.id, leadB.id, note.id, {
          content: 'Hijacked',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the lead is not owned by the customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const lead = await leadsService.create(customerA.id, { name: 'Lead' });
      const note = await service.create(customerA.id, lead.id, {
        content: 'Note',
      });

      await expect(
        service.update(customerB.id, lead.id, note.id, { content: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('removes the note', async () => {
      const customer = await seedCustomer();
      const lead = await leadsService.create(customer.id, { name: 'Lead' });
      const note = await service.create(customer.id, lead.id, {
        content: 'Note',
      });

      await service.delete(customer.id, lead.id, note.id);

      const found = await prisma.leadReferenceNote.findUnique({
        where: { id: note.id },
      });
      expect(found).toBeNull();
    });

    it('throws NotFoundException when the note belongs to a different lead', async () => {
      const customer = await seedCustomer();
      const leadA = await leadsService.create(customer.id, { name: 'A' });
      const leadB = await leadsService.create(customer.id, { name: 'B' });
      const note = await service.create(customer.id, leadA.id, {
        content: 'Note',
      });

      await expect(
        service.delete(customer.id, leadB.id, note.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
