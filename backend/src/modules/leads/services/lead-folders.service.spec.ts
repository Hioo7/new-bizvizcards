import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { LeadsService } from './leads.service';
import { LeadFoldersService } from './lead-folders.service';

describe('LeadFoldersService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let leadsService: LeadsService;
  let service: LeadFoldersService;
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
    service = new LeadFoldersService(prisma);
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
        email: `lead-folders-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  describe('list', () => {
    it('scopes results to the given customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      await service.create(customerA.id, { name: 'A Folder' });
      await service.create(customerB.id, { name: 'B Folder' });

      const result = await service.list(customerA.id);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('A Folder');
    });
  });

  describe('rename', () => {
    it('throws NotFoundException when the folder belongs to another customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const folder = await service.create(customerB.id, { name: 'Folder' });

      await expect(
        service.rename(customerA.id, folder.id, { name: 'Renamed' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('soft delete: unfiles leads instead of deleting them', async () => {
      const customer = await seedCustomer();
      const folder = await service.create(customer.id, { name: 'Folder' });
      const lead = await leadsService.create(customer.id, {
        name: 'Lead',
        folderId: folder.id,
      });

      await service.delete(customer.id, folder.id, 'soft');

      const foundFolder = await prisma.leadFolder.findUnique({
        where: { id: folder.id },
      });
      expect(foundFolder).toBeNull();
      const foundLead = await prisma.lead.findUniqueOrThrow({
        where: { id: lead.id },
      });
      expect(foundLead.folderId).toBeNull();
    });

    it('hard delete: removes leads in the folder along with it', async () => {
      const customer = await seedCustomer();
      const folder = await service.create(customer.id, { name: 'Folder' });
      const lead = await leadsService.create(customer.id, {
        name: 'Lead',
        folderId: folder.id,
      });

      await service.delete(customer.id, folder.id, 'hard');

      const foundLead = await prisma.lead.findUnique({
        where: { id: lead.id },
      });
      expect(foundLead).toBeNull();
    });

    it('defaults to soft delete when no mode is given', async () => {
      const customer = await seedCustomer();
      const folder = await service.create(customer.id, { name: 'Folder' });
      const lead = await leadsService.create(customer.id, {
        name: 'Lead',
        folderId: folder.id,
      });

      await service.delete(customer.id, folder.id);

      const foundLead = await prisma.lead.findUniqueOrThrow({
        where: { id: lead.id },
      });
      expect(foundLead.folderId).toBeNull();
    });

    it('throws NotFoundException when deleting a folder not owned by the customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const folder = await service.create(customerB.id, { name: 'Folder' });

      await expect(service.delete(customerA.id, folder.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('default folder', () => {
    it('is null by default', async () => {
      const customer = await seedCustomer();

      const result = await service.getDefaultFolder(customer.id);

      expect(result.defaultLeadFolderId).toBeNull();
    });

    it('sets and clears the default folder', async () => {
      const customer = await seedCustomer();
      const folder = await service.create(customer.id, { name: 'Folder' });

      const afterSet = await service.setDefaultFolder(customer.id, folder.id);
      expect(afterSet.defaultLeadFolderId).toBe(folder.id);

      const afterClear = await service.setDefaultFolder(customer.id, null);
      expect(afterClear.defaultLeadFolderId).toBeNull();
    });

    it('throws NotFoundException when setting a default folder not owned by the customer', async () => {
      const customerA = await seedCustomer();
      const customerB = await seedCustomer();
      const foreignFolder = await service.create(customerB.id, {
        name: 'Foreign',
      });

      await expect(
        service.setDefaultFolder(customerA.id, foreignFolder.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
