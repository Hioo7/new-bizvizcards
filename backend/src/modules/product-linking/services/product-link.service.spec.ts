import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LinkedCardType, ProductType } from '../../../generated/prisma/client';
import { ProductLinkService } from './product-link.service';

describe('ProductLinkService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: ProductLinkService;
  let originalDatabaseUrl: string | undefined;
  const seededProductIds: string[] = [];
  const seededCustomerAccountIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new ProductLinkService(prisma);
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
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededCustomerAccountIds } },
      });
      seededCustomerAccountIds.length = 0;
    }
  });

  async function seedCustomerWithEcard() {
    const account = await prisma.customerAccount.create({
      data: {
        name: 'Test Customer',
        email: `product-link-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededCustomerAccountIds.push(account.id);
    const customer = await prisma.customer.create({
      data: { accountId: account.id },
    });
    const ecard = await prisma.eCard.create({
      data: {
        customerId: customer.id,
        endpoint: `product-link-${randomUUID()}`,
        heroName: 'Test',
        heroEmail: account.email,
      },
    });
    return { customer, ecard };
  }

  async function seedUnit() {
    const product = await prisma.product.create({
      data: {
        name: `Product ${randomUUID()}`,
        productType: ProductType.STANDALONE,
      },
    });
    seededProductIds.push(product.id);
    return prisma.productUnit.create({
      data: { productId: product.id, code: randomUUID() },
    });
  }

  describe('claim', () => {
    it('links an unclaimed unit to an ecard the customer owns', async () => {
      const { customer, ecard } = await seedCustomerWithEcard();
      const unit = await seedUnit();

      await service.claim(unit.code, customer.id, {
        cardType: LinkedCardType.ECARD,
        cardId: ecard.id,
      });

      const link = await prisma.productUnitLink.findUniqueOrThrow({
        where: { productUnitId: unit.id },
      });
      expect(link.customerId).toBe(customer.id);
      expect(link.ecardId).toBe(ecard.id);
      expect(link.smartCardId).toBeNull();
    });

    it('throws ConflictException when the unit is already linked', async () => {
      const { customer, ecard } = await seedCustomerWithEcard();
      const unit = await seedUnit();
      await service.claim(unit.code, customer.id, {
        cardType: LinkedCardType.ECARD,
        cardId: ecard.id,
      });

      await expect(
        service.claim(unit.code, customer.id, {
          cardType: LinkedCardType.ECARD,
          cardId: ecard.id,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when the card does not belong to the customer', async () => {
      const { ecard } = await seedCustomerWithEcard();
      const { customer: otherCustomer } = await seedCustomerWithEcard();
      const unit = await seedUnit();

      await expect(
        service.claim(unit.code, otherCustomer.id, {
          cardType: LinkedCardType.ECARD,
          cardId: ecard.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for an unknown code', async () => {
      const { customer, ecard } = await seedCustomerWithEcard();
      await expect(
        service.claim(randomUUID(), customer.id, {
          cardType: LinkedCardType.ECARD,
          cardId: ecard.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('relink', () => {
    it('updates the link to a different card owned by the same customer', async () => {
      const { customer, ecard } = await seedCustomerWithEcard();
      const secondEcard = await prisma.eCard.create({
        data: {
          customerId: customer.id,
          endpoint: `product-link-2-${randomUUID()}`,
          heroName: 'Test',
          heroEmail: `second-${randomUUID()}@example.com`,
        },
      });
      const unit = await seedUnit();
      await service.claim(unit.code, customer.id, {
        cardType: LinkedCardType.ECARD,
        cardId: ecard.id,
      });

      await service.relink(unit.code, customer.id, {
        cardType: LinkedCardType.ECARD,
        cardId: secondEcard.id,
      });

      const link = await prisma.productUnitLink.findUniqueOrThrow({
        where: { productUnitId: unit.id },
      });
      expect(link.ecardId).toBe(secondEcard.id);
    });

    it('throws ForbiddenException when the caller does not own the unit', async () => {
      const { customer, ecard } = await seedCustomerWithEcard();
      const { customer: otherCustomer } = await seedCustomerWithEcard();
      const unit = await seedUnit();
      await service.claim(unit.code, customer.id, {
        cardType: LinkedCardType.ECARD,
        cardId: ecard.id,
      });

      await expect(
        service.relink(unit.code, otherCustomer.id, {
          cardType: LinkedCardType.ECARD,
          cardId: ecard.id,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the unit is not linked yet', async () => {
      const { customer, ecard } = await seedCustomerWithEcard();
      const unit = await seedUnit();

      await expect(
        service.relink(unit.code, customer.id, {
          cardType: LinkedCardType.ECARD,
          cardId: ecard.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unlink', () => {
    it('removes the link so the unit can be claimed again', async () => {
      const { customer, ecard } = await seedCustomerWithEcard();
      const unit = await seedUnit();
      await service.claim(unit.code, customer.id, {
        cardType: LinkedCardType.ECARD,
        cardId: ecard.id,
      });

      await service.unlink(unit.code, customer.id);

      const link = await prisma.productUnitLink.findUnique({
        where: { productUnitId: unit.id },
      });
      expect(link).toBeNull();

      const { customer: newOwner, ecard: newEcard } =
        await seedCustomerWithEcard();
      await expect(
        service.claim(unit.code, newOwner.id, {
          cardType: LinkedCardType.ECARD,
          cardId: newEcard.id,
        }),
      ).resolves.toBeUndefined();
    });

    it('throws ForbiddenException when the caller does not own the unit', async () => {
      const { customer, ecard } = await seedCustomerWithEcard();
      const { customer: otherCustomer } = await seedCustomerWithEcard();
      const unit = await seedUnit();
      await service.claim(unit.code, customer.id, {
        cardType: LinkedCardType.ECARD,
        cardId: ecard.id,
      });

      await expect(service.unlink(unit.code, otherCustomer.id)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when the unit is not linked', async () => {
      const { customer } = await seedCustomerWithEcard();
      const unit = await seedUnit();

      await expect(service.unlink(unit.code, customer.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
