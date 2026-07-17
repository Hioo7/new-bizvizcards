import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ADDRESS_MAX_PER_CUSTOMER } from '../addresses.constants';
import type { CreateAddressDto } from '../dto/create-address.dto';
import { AddressesService } from './addresses.service';

describe('AddressesService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: AddressesService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new AddressesService(prisma);
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
        email: `addresses-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  function makeDto(
    overrides: Partial<CreateAddressDto> = {},
  ): CreateAddressDto {
    return {
      label: 'Home',
      contactName: 'Jane Doe',
      contactPhoneCountryDialCode: '+1',
      contactPhoneNumber: '5551234567',
      line1: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      country: 'USA',
      pincode: '62701',
      ...overrides,
    };
  }

  describe('create/list', () => {
    it('creates an address and lists it back scoped to the owning customer only', async () => {
      const customer = await seedCustomer();
      const otherCustomer = await seedCustomer();
      await service.create(otherCustomer.id, makeDto({ label: 'Not mine' }));

      const created = await service.create(customer.id, makeDto());
      const list = await service.listForCustomer(customer.id);

      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(created.id);
      expect(list[0].label).toBe('Home');
    });

    it('rejects creating past the per-customer address cap', async () => {
      const customer = await seedCustomer();
      for (let i = 0; i < ADDRESS_MAX_PER_CUSTOMER; i++) {
        await service.create(customer.id, makeDto({ label: `Address ${i}` }));
      }
      await expect(
        service.create(customer.id, makeDto({ label: 'One too many' })),
      ).rejects.toThrow('Maximum of');
    });
  });

  describe('update/remove ownership', () => {
    it('throws 404 when updating an address owned by a different customer', async () => {
      const owner = await seedCustomer();
      const stranger = await seedCustomer();
      const address = await service.create(owner.id, makeDto());

      await expect(
        service.update(stranger.id, address.id, { label: 'Hijacked' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when removing an address owned by a different customer', async () => {
      const owner = await seedCustomer();
      const stranger = await seedCustomer();
      const address = await service.create(owner.id, makeDto());

      await expect(service.remove(stranger.id, address.id)).rejects.toThrow(
        NotFoundException,
      );

      const stillThere = await service.listForCustomer(owner.id);
      expect(stillThere).toHaveLength(1);
    });

    it('updates and removes an address for its owning customer', async () => {
      const customer = await seedCustomer();
      const address = await service.create(customer.id, makeDto());

      const updated = await service.update(customer.id, address.id, {
        label: 'Office',
      });
      expect(updated.label).toBe('Office');

      await service.remove(customer.id, address.id);
      const list = await service.listForCustomer(customer.id);
      expect(list).toHaveLength(0);
    });
  });
});
