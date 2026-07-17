import { randomUUID } from 'crypto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LinkedCardType, ProductType } from '../../../generated/prisma/client';
import { ProductProvisioningService } from './product-provisioning.service';

describe('ProductProvisioningService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: ProductProvisioningService;
  let originalDatabaseUrl: string | undefined;
  const seededProductIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new ProductProvisioningService(prisma, appConfig);
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
  });

  async function seedProduct(productType: ProductType) {
    const product = await prisma.product.create({
      data: { name: `Product ${randomUUID()}`, productType },
    });
    seededProductIds.push(product.id);
    return product;
  }

  async function seedVariant(productId: string) {
    return prisma.productVariant.create({
      data: { productId, name: 'A', sku: `sku-${randomUUID()}`, price: 10 },
    });
  }

  describe('generateForProduct', () => {
    it('creates N units with unique codes for a standalone product', async () => {
      const product = await seedProduct(ProductType.STANDALONE);
      const result = await service.generateForProduct(product.id, {
        quantity: 5,
      });
      expect(result.units).toHaveLength(5);
      const codes = new Set(result.units.map((unit) => unit.code));
      expect(codes.size).toBe(5);
      expect(result.units.every((unit) => unit.printedAt === null)).toBe(true);
    });

    it('throws BadRequestException for a variant-based product', async () => {
      const product = await seedProduct(ProductType.VARIANT_BASED);
      await expect(
        service.generateForProduct(product.id, { quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for a non-existent product', async () => {
      await expect(
        service.generateForProduct(randomUUID(), { quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateForVariant', () => {
    it('creates N units for a variant', async () => {
      const product = await seedProduct(ProductType.VARIANT_BASED);
      const variant = await seedVariant(product.id);
      const result = await service.generateForVariant(variant.id, {
        quantity: 3,
      });
      expect(result.units).toHaveLength(3);
      expect(result.units.every((unit) => unit.variantId === variant.id)).toBe(
        true,
      );
    });
  });

  describe('list', () => {
    it('filters by printed and linked status', async () => {
      const product = await seedProduct(ProductType.STANDALONE);
      await service.generateForProduct(product.id, { quantity: 4 });
      const batch = await service.createPrintBatch({
        productId: product.id,
        quantity: 2,
      });
      const [linkedUnit] = batch.units;
      const customerAccount = await prisma.customerAccount.create({
        data: {
          name: 'Test Customer',
          email: `provisioning-${randomUUID()}@example.com`,
          emailVerified: true,
        },
      });
      const customer = await prisma.customer.create({
        data: { accountId: customerAccount.id },
      });
      const ecard = await prisma.eCard.create({
        data: {
          customerId: customer.id,
          endpoint: `provisioning-${randomUUID()}`,
          heroName: 'Test',
          heroEmail: customerAccount.email,
        },
      });
      await prisma.productUnitLink.create({
        data: {
          productUnitId: linkedUnit.id,
          customerId: customer.id,
          cardType: LinkedCardType.ECARD,
          ecardId: ecard.id,
        },
      });

      const printedOnly = await service.list({
        productId: product.id,
        printed: true,
        page: 1,
        pageSize: 50,
      });
      expect(printedOnly.units).toHaveLength(2);

      const linkedOnly = await service.list({
        productId: product.id,
        linked: true,
        page: 1,
        pageSize: 50,
      });
      expect(linkedOnly.units).toHaveLength(1);
      expect(linkedOnly.units[0].id).toBe(linkedUnit.id);

      await prisma.customerAccount.delete({
        where: { id: customerAccount.id },
      });
    });
  });

  describe('createPrintBatch', () => {
    it('atomically claims the requested quantity of unprinted units', async () => {
      const product = await seedProduct(ProductType.STANDALONE);
      await service.generateForProduct(product.id, { quantity: 10 });

      const first = await service.createPrintBatch({
        productId: product.id,
        quantity: 4,
      });
      expect(first.units).toHaveLength(4);
      expect(
        first.units.every((unit) => unit.printBatchId === first.printBatchId),
      ).toBe(true);

      const second = await service.createPrintBatch({
        productId: product.id,
        quantity: 3,
      });
      expect(second.units).toHaveLength(3);
      const firstIds = new Set(first.units.map((unit) => unit.id));
      expect(second.units.every((unit) => !firstIds.has(unit.id))).toBe(true);
    });

    it('throws BadRequestException and marks nothing when not enough unprinted units exist', async () => {
      const product = await seedProduct(ProductType.STANDALONE);
      await service.generateForProduct(product.id, { quantity: 2 });

      await expect(
        service.createPrintBatch({ productId: product.id, quantity: 5 }),
      ).rejects.toThrow(BadRequestException);

      const stillUnprinted = await prisma.productUnit.count({
        where: { productId: product.id, printedAt: null },
      });
      expect(stillUnprinted).toBe(2);
    });

    it('throws NotFoundException for a non-existent product', async () => {
      await expect(
        service.createPrintBatch({ productId: randomUUID(), quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePrintStatus', () => {
    it('clears printedAt/printBatchId when correcting to unprinted', async () => {
      const product = await seedProduct(ProductType.STANDALONE);
      await service.generateForProduct(product.id, { quantity: 1 });
      const batch = await service.createPrintBatch({
        productId: product.id,
        quantity: 1,
      });
      const unit = batch.units[0];

      const corrected = await service.updatePrintStatus(unit.id, {
        printed: false,
      });
      expect(corrected.printedAt).toBeNull();
      expect(corrected.printBatchId).toBeNull();
    });

    it('marks a unit as printed manually', async () => {
      const product = await seedProduct(ProductType.STANDALONE);
      const generated = await service.generateForProduct(product.id, {
        quantity: 1,
      });
      const unit = generated.units[0];

      const marked = await service.updatePrintStatus(unit.id, {
        printed: true,
      });
      expect(marked.printedAt).not.toBeNull();
    });

    it('throws NotFoundException for a non-existent unit', async () => {
      await expect(
        service.updatePrintStatus(randomUUID(), { printed: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
