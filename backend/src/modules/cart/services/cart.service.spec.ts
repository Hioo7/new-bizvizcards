import { randomUUID } from 'crypto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { MediaService } from '../../../common/media/media.service';
import type { MediaStorageProviderRegistry } from '../../../common/media/storage/media-storage-provider-registry.provider';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaSource, ProductType } from '../../../generated/prisma/client';
import { ProductsService } from '../../products/services/products.service';
import { CartService } from './cart.service';

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

describe('CartService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: CartService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
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
    service = new CartService(prisma, productsService);
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
        email: `cart-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedStandaloneProduct(
    overrides: Partial<{ price: number; isActive: boolean }> = {},
  ) {
    const product = await prisma.product.create({
      data: {
        name: `Product ${randomUUID()}`,
        productType: ProductType.STANDALONE,
        price: overrides.price ?? 25,
        isActive: overrides.isActive ?? true,
      },
    });
    seededProductIds.push(product.id);
    return product;
  }

  async function seedVariant() {
    const product = await prisma.product.create({
      data: {
        name: `Product ${randomUUID()}`,
        productType: ProductType.VARIANT_BASED,
      },
    });
    seededProductIds.push(product.id);
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        name: 'Large',
        sku: `sku-${randomUUID()}`,
        price: 40,
      },
    });
    return variant;
  }

  it('lazily creates an empty cart for a customer with no cart yet', async () => {
    const customer = await seedCustomer();
    const cart = await service.getForCustomer(customer.id);
    expect(cart.items).toEqual([]);
    expect(cart.totalAmount).toBe(0);
  });

  it('adds a standalone product to the cart with its live price', async () => {
    const customer = await seedCustomer();
    const product = await seedStandaloneProduct({ price: 25 });

    const cart = await service.addItem(customer.id, {
      productId: product.id,
      quantity: 2,
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].unitPrice).toBe(25);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.items[0].lineTotal).toBe(50);
    expect(cart.totalAmount).toBe(50);
  });

  it('increments quantity instead of duplicating a row when the same item is added twice', async () => {
    const customer = await seedCustomer();
    const product = await seedStandaloneProduct();

    await service.addItem(customer.id, { productId: product.id, quantity: 1 });
    const cart = await service.addItem(customer.id, {
      productId: product.id,
      quantity: 3,
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(4);
  });

  it('adds a variant to the cart with the variant name/sku/price', async () => {
    const customer = await seedCustomer();
    const variant = await seedVariant();

    const cart = await service.addItem(customer.id, {
      variantId: variant.id,
      quantity: 1,
    });

    expect(cart.items[0].variantId).toBe(variant.id);
    expect(cart.items[0].sku).toBe(variant.sku);
    expect(cart.items[0].unitPrice).toBe(40);
  });

  it('rejects adding an inactive product', async () => {
    const customer = await seedCustomer();
    const product = await seedStandaloneProduct({ isActive: false });

    await expect(
      service.addItem(customer.id, { productId: product.id, quantity: 1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects updating/removing a cart item that belongs to a different customer', async () => {
    const owner = await seedCustomer();
    const stranger = await seedCustomer();
    const product = await seedStandaloneProduct();
    const cart = await service.addItem(owner.id, {
      productId: product.id,
      quantity: 1,
    });
    const itemId = cart.items[0].id;

    await expect(
      service.updateItemQuantity(stranger.id, itemId, { quantity: 5 }),
    ).rejects.toThrow(NotFoundException);
    await expect(service.removeItem(stranger.id, itemId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates quantity, removes an item, and clears the cart', async () => {
    const customer = await seedCustomer();
    const product = await seedStandaloneProduct({ price: 10 });
    const added = await service.addItem(customer.id, {
      productId: product.id,
      quantity: 1,
    });
    const itemId = added.items[0].id;

    const updated = await service.updateItemQuantity(customer.id, itemId, {
      quantity: 5,
    });
    expect(updated.items[0].quantity).toBe(5);

    const afterRemove = await service.removeItem(customer.id, itemId);
    expect(afterRemove.items).toHaveLength(0);

    await service.addItem(customer.id, { productId: product.id, quantity: 2 });
    await service.clear(customer.id);
    const finalCart = await service.getForCustomer(customer.id);
    expect(finalCart.items).toHaveLength(0);
  });
});
