import { randomUUID } from 'crypto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { MediaService } from '../../../common/media/media.service';
import type { MediaStorageProviderRegistry } from '../../../common/media/storage/media-storage-provider-registry.provider';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  MediaSource,
  OrderStatus,
  ProductType,
} from '../../../generated/prisma/client';
import { AddressesService } from '../../addresses/services/addresses.service';
import { CartService } from '../../cart/services/cart.service';
import { ProductsService } from '../../products/services/products.service';
import { OrdersService } from './orders.service';

class FakeMediaStorageProvider {
  upload() {
    return Promise.resolve();
  }
  delete() {
    return Promise.resolve();
  }
  getPublicUrl(key: string) {
    return `/media/test-bucket/${key}`;
  }
}

describe('OrdersService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: OrdersService;
  let cartService: CartService;
  let addressesService: AddressesService;
  let originalDatabaseUrl: string | undefined;
  const seededCustomerAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededProductIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    const registry = {
      [MediaSource.MINIO]: new FakeMediaStorageProvider(),
    } as unknown as MediaStorageProviderRegistry;
    const mediaService = new MediaService(prisma, registry);
    const productsService = new ProductsService(prisma, mediaService);
    cartService = new CartService(prisma, productsService);
    addressesService = new AddressesService(prisma);
    service = new OrdersService(prisma, addressesService, cartService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededProductIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: seededProductIds } },
      });
      seededProductIds.length = 0;
    }
    if (seededCustomerAccountIds.length > 0) {
      // Order.customerId is onDelete: Restrict (orders must never silently
      // disappear if a customer is removed) — placed orders have to be
      // cleared before the owning CustomerAccount can be deleted.
      await prisma.order.deleteMany({
        where: { customer: { accountId: { in: seededCustomerAccountIds } } },
      });
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededCustomerAccountIds } },
      });
      seededCustomerAccountIds.length = 0;
    }
    if (seededEmployeeAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededEmployeeAccountIds } },
      });
      seededEmployeeAccountIds.length = 0;
    }
  });

  async function seedCustomer(name = 'Test Buyer') {
    const account = await prisma.customerAccount.create({
      data: {
        name,
        email: `orders-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededCustomerAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedEmployee() {
    const account = await prisma.employeeAccount.create({
      data: {
        name: 'Order Manager',
        email: `orders-service-employee-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'admin',
      },
    });
    seededEmployeeAccountIds.push(account.id);
    await prisma.employee.create({ data: { accountId: account.id } });
    return account.id;
  }

  async function seedStandaloneProduct(price = 25) {
    const product = await prisma.product.create({
      data: {
        name: `Product ${randomUUID()}`,
        productType: ProductType.STANDALONE,
        price,
      },
    });
    seededProductIds.push(product.id);
    return product;
  }

  async function seedAddressAndCart(customerId: string, productId: string) {
    const address = await addressesService.create(customerId, {
      label: 'Home',
      contactName: 'Jane Doe',
      contactPhoneCountryDialCode: '+1',
      contactPhoneNumber: '5551234567',
      line1: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      country: 'USA',
      pincode: '62701',
    });
    await cartService.addItem(customerId, { productId, quantity: 2 });
    return address;
  }

  describe('placeOrderForCustomer', () => {
    it('rejects placing an order with an empty cart', async () => {
      const customer = await seedCustomer();
      const address = await addressesService.create(customer.id, {
        label: 'Home',
        contactName: 'Jane Doe',
        contactPhoneCountryDialCode: '+1',
        contactPhoneNumber: '5551234567',
        line1: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        country: 'USA',
        pincode: '62701',
      });

      await expect(
        service.placeOrderForCustomer(customer.id, { addressId: address.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects placing an order against another customer's address", async () => {
      const customer = await seedCustomer();
      const stranger = await seedCustomer();
      const product = await seedStandaloneProduct();
      await cartService.addItem(customer.id, {
        productId: product.id,
        quantity: 1,
      });
      const strangerAddress = await addressesService.create(stranger.id, {
        label: 'Home',
        contactName: 'Stranger',
        contactPhoneCountryDialCode: '+1',
        contactPhoneNumber: '5559999999',
        line1: '1 Other St',
        city: 'Elsewhere',
        state: 'IL',
        country: 'USA',
        pincode: '62701',
      });

      await expect(
        service.placeOrderForCustomer(customer.id, {
          addressId: strangerAddress.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates an immutable snapshot that survives later edits to the product/address/account', async () => {
      const customer = await seedCustomer('Original Name');
      const product = await seedStandaloneProduct(25);
      const address = await seedAddressAndCart(customer.id, product.id);

      const order = await service.placeOrderForCustomer(customer.id, {
        addressId: address.id,
      });

      expect(order.status).toBe(OrderStatus.PLACED);
      expect(order.buyerName).toBe('Original Name');
      expect(order.totalAmount).toBe(50);
      expect(order.items).toHaveLength(1);
      expect(order.items[0].unitPrice).toBe(25);
      expect(order.shippingAddress.line1).toBe('123 Main St');
      expect(order.statusHistory).toHaveLength(1);
      expect(order.statusHistory[0].fromStatus).toBeNull();
      expect(order.statusHistory[0].toStatus).toBe(OrderStatus.PLACED);

      // The cart is cleared once the order is placed.
      const cartAfter = await cartService.getForCustomer(customer.id);
      expect(cartAfter.items).toHaveLength(0);

      // Mutate everything the order snapshotted.
      await prisma.product.update({
        where: { id: product.id },
        data: { price: 999, name: 'Renamed Product' },
      });
      await prisma.customerAccount.update({
        where: { id: customer.accountId },
        data: { name: 'Changed Name' },
      });
      await addressesService.update(customer.id, address.id, {
        line1: '999 Changed Ave',
      });

      const reloaded = await service.getForCustomer(customer.id, order.id);
      expect(reloaded.buyerName).toBe('Original Name');
      expect(reloaded.items[0].unitPrice).toBe(25);
      expect(reloaded.items[0].productName).not.toBe('Renamed Product');
      expect(reloaded.shippingAddress.line1).toBe('123 Main St');
      expect(reloaded.totalAmount).toBe(50);
    });

    it("throws 404 when fetching another customer's order", async () => {
      const customer = await seedCustomer();
      const stranger = await seedCustomer();
      const product = await seedStandaloneProduct();
      const address = await seedAddressAndCart(customer.id, product.id);
      const order = await service.placeOrderForCustomer(customer.id, {
        addressId: address.id,
      });

      await expect(
        service.getForCustomer(stranger.id, order.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('applies a legal transition and appends a status history row', async () => {
      const customer = await seedCustomer();
      const product = await seedStandaloneProduct();
      const address = await seedAddressAndCart(customer.id, product.id);
      const order = await service.placeOrderForCustomer(customer.id, {
        addressId: address.id,
      });
      const employeeAccountId = await seedEmployee();

      const updated = await service.updateStatus(
        order.id,
        { status: OrderStatus.CONFIRMED },
        employeeAccountId,
      );

      expect(updated.status).toBe(OrderStatus.CONFIRMED);
      expect(updated.statusHistory).toHaveLength(2);
      expect(updated.statusHistory[1].fromStatus).toBe(OrderStatus.PLACED);
      expect(updated.statusHistory[1].toStatus).toBe(OrderStatus.CONFIRMED);
      expect(updated.statusHistory[1].changedByEmployeeName).toBe(
        'Order Manager',
      );
    });

    it('rejects an illegal transition (PLACED straight to DELIVERED)', async () => {
      const customer = await seedCustomer();
      const product = await seedStandaloneProduct();
      const address = await seedAddressAndCart(customer.id, product.id);
      const order = await service.placeOrderForCustomer(customer.id, {
        addressId: address.id,
      });
      const employeeAccountId = await seedEmployee();

      await expect(
        service.updateStatus(
          order.id,
          { status: OrderStatus.DELIVERED },
          employeeAccountId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects any transition out of a terminal state (CANCELLED)', async () => {
      const customer = await seedCustomer();
      const product = await seedStandaloneProduct();
      const address = await seedAddressAndCart(customer.id, product.id);
      const order = await service.placeOrderForCustomer(customer.id, {
        addressId: address.id,
      });
      const employeeAccountId = await seedEmployee();
      await service.updateStatus(
        order.id,
        { status: OrderStatus.CANCELLED },
        employeeAccountId,
      );

      await expect(
        service.updateStatus(
          order.id,
          { status: OrderStatus.CONFIRMED },
          employeeAccountId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
