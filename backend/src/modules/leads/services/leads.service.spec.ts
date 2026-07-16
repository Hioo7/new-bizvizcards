import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  LeadSourceType,
  SmartCardTemplateKey,
} from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { LeadsService } from './leads.service';

describe('LeadsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let service: LeadsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new LeadsService(
      prisma,
      new PlanEnforcementService(prisma, new PlanPolicyResolverService(prisma)),
    );

    await prisma.smartCardTemplate.upsert({
      where: { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE },
      update: {},
      create: {
        key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        name: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      // Cascades Customer -> SmartCard/Lead/LeadFolder rows created for that customer.
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
        email: `leads-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedSmartCard(customerId: string | null) {
    const template = await prisma.smartCardTemplate.findUniqueOrThrow({
      where: { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE },
    });
    return prisma.smartCard.create({
      data: {
        templateId: template.id,
        endpoint: `leads-service-${randomUUID()}`,
        customerId,
      },
    });
  }

  describe('createFromExchangeContact', () => {
    it('creates a lead linked to the smart card owner and records the source type', async () => {
      const customer = await seedCustomer();
      const smartCard = await seedSmartCard(customer.id);

      const lead = await service.createFromExchangeContact(smartCard.endpoint, {
        name: 'Visitor One',
        countryDialCode: '91',
        phoneNumber: '9876543210',
      });

      expect(lead.customerId).toBe(customer.id);
      expect(lead.sourcedBy).toBe(LeadSourceType.SMART_CARD);
      expect(lead.folderId).toBeNull();
    });

    it("files the lead into the customer's active folder when one is set", async () => {
      const customer = await seedCustomer();
      const smartCard = await seedSmartCard(customer.id);
      const folder = await prisma.leadFolder.create({
        data: { customerId: customer.id, name: 'Active Folder' },
      });
      await prisma.customer.update({
        where: { id: customer.id },
        data: { defaultLeadFolderId: folder.id },
      });

      const lead = await service.createFromExchangeContact(smartCard.endpoint, {
        name: 'Visitor Two',
        countryDialCode: '91',
        phoneNumber: '9876543211',
      });

      expect(lead.folderId).toBe(folder.id);
    });

    it('throws NotFoundException when the smart card endpoint does not exist', async () => {
      await expect(
        service.createFromExchangeContact('does-not-exist', {
          name: 'Visitor',
          countryDialCode: '91',
          phoneNumber: '9876543210',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the smart card has no linked customer', async () => {
      const smartCard = await seedSmartCard(null);

      await expect(
        service.createFromExchangeContact(smartCard.endpoint, {
          name: 'Visitor',
          countryDialCode: '91',
          phoneNumber: '9876543210',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('scopes results to the given customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      await service.create(customerA.id, { name: 'A Lead' });
      await service.create(customerB.id, { name: 'B Lead' });

      const result = await service.list(customerA.id, {});

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('A Lead');
    });

    it('filters by folderId when provided', async () => {
      const customer = await seedCustomer();
      const folder = await prisma.leadFolder.create({
        data: { customerId: customer.id, name: 'Folder' },
      });
      const inFolder = await service.create(customer.id, {
        name: 'In folder',
        folderId: folder.id,
      });
      await service.create(customer.id, { name: 'At root' });

      const result = await service.list(customer.id, { folderId: folder.id });

      expect(result.map((l) => l.id)).toEqual([inFolder.id]);
    });
  });

  describe('getById', () => {
    it('throws NotFoundException for a lead owned by another customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const lead = await service.create(customerA.id, { name: 'A Lead' });

      await expect(service.getById(customerB.id, lead.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('defaults sourcedBy to MANUAL_ENTRY', async () => {
      const customer = await seedCustomer();

      const lead = await service.create(customer.id, { name: 'Lead' });

      expect(lead.sourcedBy).toBe(LeadSourceType.MANUAL_ENTRY);
      expect(lead.stage).toBeNull();
    });

    it('throws NotFoundException when folderId belongs to another customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const foreignFolder = await prisma.leadFolder.create({
        data: { customerId: customerB.id, name: 'Foreign' },
      });

      await expect(
        service.create(customerA.id, {
          name: 'Lead',
          folderId: foreignFolder.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates fields and reassigns the folder after ownership check', async () => {
      const customer = await seedCustomer();
      const lead = await service.create(customer.id, { name: 'Lead' });
      const folder = await prisma.leadFolder.create({
        data: { customerId: customer.id, name: 'Folder' },
      });

      const updated = await service.update(customer.id, lead.id, {
        name: 'Updated Lead',
        folderId: folder.id,
      });

      expect(updated.name).toBe('Updated Lead');
      expect(updated.folderId).toBe(folder.id);
    });

    it('clears a nullable field when explicitly set to null', async () => {
      const customer = await seedCustomer();
      const lead = await service.create(customer.id, {
        name: 'Lead',
        email: 'lead@example.com',
      });

      const updated = await service.update(customer.id, lead.id, {
        email: null,
      });

      expect(updated.email).toBeNull();
    });

    it('throws NotFoundException when updating a lead not owned by the customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const lead = await service.create(customerA.id, { name: 'Lead' });

      await expect(
        service.update(customerB.id, lead.id, { name: 'Hijacked' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('removes the lead', async () => {
      const customer = await seedCustomer();
      const lead = await service.create(customer.id, { name: 'Lead' });

      await service.delete(customer.id, lead.id);

      const found = await prisma.lead.findUnique({ where: { id: lead.id } });
      expect(found).toBeNull();
    });

    it('throws NotFoundException when deleting a lead not owned by the customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const lead = await service.create(customerA.id, { name: 'Lead' });

      await expect(service.delete(customerB.id, lead.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
