import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { OrganisationsService } from './organisations.service';

describe('OrganisationsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: OrganisationsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededOrganisationIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new OrganisationsService(prisma);
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
  });

  async function seedCustomer() {
    const account = await prisma.customerAccount.create({
      data: {
        name: 'Test Customer',
        email: `organisations-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  describe('create', () => {
    it('creates an organisation and makes the creator its SPOC', async () => {
      const customer = await seedCustomer();

      const { organisation, membership } = await service.create(customer.id, {
        name: 'Acme Inc',
      });
      seededOrganisationIds.push(organisation.id);

      expect(organisation.name).toBe('Acme Inc');
      expect(organisation.createdByCustomerId).toBe(customer.id);
      expect(membership.customerId).toBe(customer.id);
      expect(membership.role).toBe('SPOC');
    });

    it('rejects creating a second organisation for the same customer', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'First',
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.create(customer.id, { name: 'Second' }),
      ).rejects.toThrow('Customer already belongs to an organisation');
    });
  });

  describe('getMine', () => {
    it('returns null when the customer has no organisation', async () => {
      const customer = await seedCustomer();
      await expect(service.getMine(customer.id)).resolves.toBeNull();
    });

    it('returns the organisation and membership when the customer belongs to one', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'Acme Inc',
      });
      seededOrganisationIds.push(organisation.id);

      const result = await service.getMine(customer.id);
      expect(result?.organisation.id).toBe(organisation.id);
    });
  });

  describe('update', () => {
    it('allows the SPOC to rename the organisation', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'Old Name',
      });
      seededOrganisationIds.push(organisation.id);

      const updated = await service.update(customer.id, { name: 'New Name' });
      expect(updated.name).toBe('New Name');
    });

    it('rejects a non-SPOC member renaming the organisation', async () => {
      const spoc = await seedCustomer();
      const member = await seedCustomer();
      const { organisation } = await service.create(spoc.id, {
        name: 'Acme Inc',
      });
      seededOrganisationIds.push(organisation.id);
      await prisma.organisationMember.create({
        data: { organisationId: organisation.id, customerId: member.id },
      });

      await expect(
        service.update(member.id, { name: 'Renamed' }),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
    });

    it('throws when the customer has no organisation', async () => {
      const customer = await seedCustomer();
      await expect(
        service.update(customer.id, { name: 'Renamed' }),
      ).rejects.toThrow('Customer does not belong to an organisation');
    });
  });

  describe('employee-facing methods', () => {
    it('lists organisations with pagination', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: `Paginated Org ${randomUUID()}`,
      });
      seededOrganisationIds.push(organisation.id);

      const result = await service.listAllForEmployee({
        page: 1,
        pageSize: 20,
      });
      expect(result.organisations.map((o) => o.id)).toContain(organisation.id);
    });

    it('gets an organisation by id, throwing when not found', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'Findable Org',
      });
      seededOrganisationIds.push(organisation.id);

      await expect(
        service.getByIdForEmployee(organisation.id),
      ).resolves.toMatchObject({ id: organisation.id });
      await expect(service.getByIdForEmployee(randomUUID())).rejects.toThrow(
        'Organisation not found',
      );
    });

    it('removes an organisation', async () => {
      const customer = await seedCustomer();
      const { organisation } = await service.create(customer.id, {
        name: 'Removable Org',
      });

      await service.removeForEmployee(organisation.id);

      await expect(
        prisma.organisation.findUnique({ where: { id: organisation.id } }),
      ).resolves.toBeNull();
    });
  });
});
