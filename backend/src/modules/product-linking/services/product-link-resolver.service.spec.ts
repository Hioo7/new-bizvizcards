import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { MediaService } from '../../../common/media/media.service';
import type { MediaStorageProviderRegistry } from '../../../common/media/storage/media-storage-provider-registry.provider';
import type {
  MediaStorageProvider,
  UploadMediaParams,
} from '../../../common/media/storage/media-storage-provider.interface';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  LinkedCardType,
  MediaSource,
  ProductMediaPurpose,
  ProductType,
  SmartCardTemplateKey,
} from '../../../generated/prisma/client';
import { ProductLinkResolverService } from './product-link-resolver.service';

class FakeMediaStorageProvider implements MediaStorageProvider {
  upload(params: UploadMediaParams): Promise<void> {
    void params;
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    void key;
    return Promise.resolve();
  }

  getPublicUrl(key: string): string {
    return `/media/test-bucket/${key}`;
  }
}

describe('ProductLinkResolverService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let mediaService: MediaService;
  let service: ProductLinkResolverService;
  let originalDatabaseUrl: string | undefined;
  const seededProductIds: string[] = [];
  const seededCustomerAccountIds: string[] = [];
  const seededSmartCardIds: string[] = [];
  const seededMediaIds: string[] = [];

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    // SmartCardTemplate rows are shared fixture data (fixed enum keys),
    // upserted rather than created/deleted per test — same convention as
    // SmartCardTemplatesService's own integration spec.
    for (const key of Object.values(SmartCardTemplateKey)) {
      await prisma.smartCardTemplate.upsert({
        where: { key },
        update: {},
        create: { key, name: key },
      });
    }
    const registry: MediaStorageProviderRegistry = {
      [MediaSource.MINIO]: new FakeMediaStorageProvider(),
    };
    mediaService = new MediaService(prisma, registry);
    service = new ProductLinkResolverService(prisma, mediaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededSmartCardIds.length > 0) {
      await prisma.smartCard.deleteMany({
        where: { id: { in: seededSmartCardIds } },
      });
      seededSmartCardIds.length = 0;
    }
    if (seededProductIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: seededProductIds } },
      });
      seededProductIds.length = 0;
    }
    if (seededMediaIds.length > 0) {
      await prisma.media.deleteMany({
        where: { id: { in: seededMediaIds } },
      });
      seededMediaIds.length = 0;
    }
    if (seededCustomerAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededCustomerAccountIds } },
      });
      seededCustomerAccountIds.length = 0;
    }
  });

  async function seedCustomer() {
    const account = await prisma.customerAccount.create({
      data: {
        name: 'Test Customer',
        email: `link-resolver-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededCustomerAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedProduct(productType: ProductType) {
    const product = await prisma.product.create({
      data: { name: `Product ${randomUUID()}`, productType },
    });
    seededProductIds.push(product.id);
    return product;
  }

  async function seedUnit(
    scope: { productId: string } | { variantId: string },
  ) {
    return prisma.productUnit.create({
      data: { ...scope, code: randomUUID() },
    });
  }

  async function seedPreviewMedia(
    scope: { productId: string } | { variantId: string },
  ) {
    const media = await mediaService.upload({
      buffer: Buffer.from('gif-bytes'),
      contentType: 'image/gif',
      originalName: 'preview.gif',
      extension: 'gif',
      keyPrefix: 'products/test',
    });
    seededMediaIds.push(media.id);
    await prisma.productMedia.create({
      data: {
        ...scope,
        mediaId: media.id,
        purpose: ProductMediaPurpose.PREVIEW,
      },
    });
    return media;
  }

  describe('resolve', () => {
    it('returns not_found for an unknown code', async () => {
      const result = await service.resolve(randomUUID());
      expect(result).toEqual({ status: 'not_found' });
    });

    it('returns unclaimed with no preview when no PREVIEW media exists', async () => {
      const product = await seedProduct(ProductType.STANDALONE);
      const unit = await seedUnit({ productId: product.id });

      const result = await service.resolve(unit.code);
      expect(result).toEqual({
        status: 'unclaimed',
        product: { id: product.id, name: product.name },
        variant: null,
        previewMediaUrl: null,
      });
    });

    it('returns the product-level preview media for a standalone product', async () => {
      const product = await seedProduct(ProductType.STANDALONE);
      const unit = await seedUnit({ productId: product.id });
      await seedPreviewMedia({ productId: product.id });

      const result = await service.resolve(unit.code);
      expect(result.status).toBe('unclaimed');
      if (result.status === 'unclaimed') {
        expect(result.previewMediaUrl).not.toBeNull();
      }
    });

    it("prefers the variant's preview media over the product's", async () => {
      const product = await seedProduct(ProductType.VARIANT_BASED);
      await seedPreviewMedia({ productId: product.id });
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: 'A',
          sku: `sku-${randomUUID()}`,
          price: 10,
        },
      });
      const variantMedia = await seedPreviewMedia({ variantId: variant.id });
      const unit = await seedUnit({ variantId: variant.id });

      const result = await service.resolve(unit.code);
      expect(result.status).toBe('unclaimed');
      if (result.status === 'unclaimed') {
        expect(result.variant).toEqual({ id: variant.id, name: variant.name });
        expect(result.previewMediaUrl).toBe(
          mediaService.getPublicUrl(variantMedia),
        );
      }
    });

    it('returns linked with the ecard endpoint when linked to an ECard', async () => {
      const customer = await seedCustomer();
      const ecard = await prisma.eCard.create({
        data: {
          customerId: customer.id,
          endpoint: `link-resolver-${randomUUID()}`,
          heroName: 'Test',
          heroEmail: 'test@example.com',
        },
      });
      const product = await seedProduct(ProductType.STANDALONE);
      const unit = await seedUnit({ productId: product.id });
      await prisma.productUnitLink.create({
        data: {
          productUnitId: unit.id,
          customerId: customer.id,
          cardType: LinkedCardType.ECARD,
          ecardId: ecard.id,
        },
      });

      const result = await service.resolve(unit.code);
      expect(result).toEqual({
        status: 'linked',
        cardType: LinkedCardType.ECARD,
        endpoint: ecard.endpoint,
      });
    });

    it('returns linked with the smart card endpoint when linked to a SmartCard', async () => {
      const customer = await seedCustomer();
      const template = await prisma.smartCardTemplate.findUniqueOrThrow({
        where: { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE },
      });
      const smartCard = await prisma.smartCard.create({
        data: {
          customerId: customer.id,
          templateId: template.id,
          endpoint: `link-resolver-sc-${randomUUID()}`,
        },
      });
      seededSmartCardIds.push(smartCard.id);
      const product = await seedProduct(ProductType.STANDALONE);
      const unit = await seedUnit({ productId: product.id });
      await prisma.productUnitLink.create({
        data: {
          productUnitId: unit.id,
          customerId: customer.id,
          cardType: LinkedCardType.SMART_CARD,
          smartCardId: smartCard.id,
        },
      });

      const result = await service.resolve(unit.code);
      expect(result).toEqual({
        status: 'linked',
        cardType: LinkedCardType.SMART_CARD,
        endpoint: smartCard.endpoint,
      });
    });
  });
});
