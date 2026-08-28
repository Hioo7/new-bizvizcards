import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { MediaService } from '../../../common/media/media.service';
import type { MediaStorageProviderRegistry } from '../../../common/media/storage/media-storage-provider-registry.provider';
import type {
  MediaStorageProvider,
  UploadMediaParams,
} from '../../../common/media/storage/media-storage-provider.interface';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  MediaSource,
  ProductMediaPurpose,
  ProductType,
} from '../../../generated/prisma/client';
import {
  PRODUCT_MEDIA_GALLERY_MAX_PER_SCOPE,
  PRODUCT_MEDIA_MAX_SIZE_BYTES,
  PRODUCT_VARIANT_SKU_GENERATION_MAX_ATTEMPTS,
  PRODUCT_VARIANT_SKU_PREFIX,
  PRODUCT_VARIANT_SKU_RANDOM_ALPHABET,
  PRODUCT_VARIANT_SKU_RANDOM_LENGTH,
} from '../products.constants';
import { ProductsService } from './products.service';

class FakeMediaStorageProvider implements MediaStorageProvider {
  upload(params: UploadMediaParams): Promise<void> {
    void params;
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    void key;
    return Promise.resolve();
  }

  download(key: string): Promise<Buffer> {
    void key;
    return Promise.resolve(Buffer.alloc(0));
  }

  getPublicUrl(key: string): string {
    return `/media/test-bucket/${key}`;
  }
}

function makeImageFile(
  content = 'fake-bytes',
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'test.png',
    mimetype: 'image/png',
    buffer: Buffer.from(content),
    size: content.length,
    ...overrides,
  } as Express.Multer.File;
}

describe('ProductsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let mediaService: MediaService;
  let service: ProductsService;
  let originalDatabaseUrl: string | undefined;
  const seededProductIds: string[] = [];
  const seededMediaIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    const registry: MediaStorageProviderRegistry = {
      [MediaSource.MINIO]: new FakeMediaStorageProvider(),
    };
    mediaService = new MediaService(prisma, registry);
    service = new ProductsService(prisma, mediaService);
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
    if (seededMediaIds.length > 0) {
      await prisma.media.deleteMany({
        where: { id: { in: seededMediaIds } },
      });
      seededMediaIds.length = 0;
    }
    if (seededEmployeeAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededEmployeeAccountIds } },
      });
      seededEmployeeAccountIds.length = 0;
    }
  });

  async function seedEmployeeAccountId(): Promise<string> {
    const account = await prisma.employeeAccount.create({
      data: {
        name: 'Test Employee',
        email: `products-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededEmployeeAccountIds.push(account.id);
    await prisma.employee.create({ data: { accountId: account.id } });
    return account.id;
  }

  async function createProduct(
    productType: ProductType = ProductType.STANDALONE,
  ) {
    const actorAccountId = await seedEmployeeAccountId();
    const product = await service.create(
      {
        name: `Product ${randomUUID()}`,
        productType,
        ...(productType === ProductType.STANDALONE && { price: 10 }),
      },
      actorAccountId,
    );
    seededProductIds.push(product.id);
    return product;
  }

  describe('create / getById', () => {
    it('creates a standalone product', async () => {
      const product = await createProduct(ProductType.STANDALONE);
      expect(product.productType).toBe(ProductType.STANDALONE);
      expect(product.variants).toEqual([]);
    });

    it('creates a variant-based product', async () => {
      const product = await createProduct(ProductType.VARIANT_BASED);
      expect(product.productType).toBe(ProductType.VARIANT_BASED);
    });

    it('throws NotFoundException for a non-existent id', async () => {
      await expect(service.getById(randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates name/description/isActive without changing productType', async () => {
      const product = await createProduct();
      const updated = await service.update(product.id, {
        name: 'Renamed',
        isActive: false,
      });
      expect(updated.name).toBe('Renamed');
      expect(updated.isActive).toBe(false);
      expect(updated.productType).toBe(ProductType.STANDALONE);
    });
  });

  describe('remove', () => {
    it('deletes a product with no provisioned units', async () => {
      const product = await createProduct();
      await service.remove(product.id);
      await expect(service.getById(product.id)).rejects.toThrow(
        NotFoundException,
      );
      seededProductIds.length = 0;
    });

    it('throws ConflictException when the product has provisioned units', async () => {
      const product = await createProduct();
      const unit = await prisma.productUnit.create({
        data: { productId: product.id, code: randomUUID() },
      });

      await expect(service.remove(product.id)).rejects.toThrow(
        ConflictException,
      );

      await prisma.productUnit.delete({ where: { id: unit.id } });
    });

    it('throws ConflictException when a VARIANT_BASED product has units provisioned on a variant (not the product directly)', async () => {
      const product = await createProduct(ProductType.VARIANT_BASED);
      const withVariant = await service.createVariant(product.id, {
        name: 'A',
        sku: `sku-${randomUUID()}`,
        price: 10,
      });
      const variantId = withVariant.variants[0].id;
      const unit = await prisma.productUnit.create({
        data: { variantId, code: randomUUID() },
      });

      await expect(service.remove(product.id)).rejects.toThrow(
        ConflictException,
      );
      // The product (and its variant) must still exist — the guard must
      // reject before any delete happens, not partially cascade.
      await expect(service.getById(product.id)).resolves.toBeDefined();

      await prisma.productUnit.delete({ where: { id: unit.id } });
    });
  });

  describe('createVariant', () => {
    it('creates a variant on a variant-based product', async () => {
      const product = await createProduct(ProductType.VARIANT_BASED);
      const updated = await service.createVariant(product.id, {
        name: 'Black / Large',
        sku: `sku-${randomUUID()}`,
        price: 10,
      });
      expect(updated.variants).toHaveLength(1);
      expect(updated.variants[0].name).toBe('Black / Large');
    });

    it('throws BadRequestException on a standalone product', async () => {
      const product = await createProduct(ProductType.STANDALONE);
      await expect(
        service.createVariant(product.id, {
          name: 'Black',
          sku: `sku-${randomUUID()}`,
          price: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException for a duplicate SKU', async () => {
      const product = await createProduct(ProductType.VARIANT_BASED);
      const sku = `sku-${randomUUID()}`;
      await service.createVariant(product.id, { name: 'A', sku, price: 10 });

      await expect(
        service.createVariant(product.id, { name: 'B', sku, price: 10 }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException (not a raw DB error) when two concurrent requests race on the same SKU', async () => {
      const productA = await createProduct(ProductType.VARIANT_BASED);
      const productB = await createProduct(ProductType.VARIANT_BASED);
      const sku = `sku-${randomUUID()}`;

      // Both pass the pre-check (neither sees the other's row yet) and race
      // on the actual insert — exactly the TOCTOU window the P2002 catch
      // in createVariant guards against.
      const results = await Promise.allSettled([
        service.createVariant(productA.id, { name: 'A', sku, price: 10 }),
        service.createVariant(productB.id, { name: 'B', sku, price: 10 }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(ConflictException);
    });
  });

  describe('updateVariant', () => {
    it('throws ConflictException (not a raw DB error) when two concurrent updates race on the same SKU', async () => {
      const product = await createProduct(ProductType.VARIANT_BASED);
      const withVariants = await service.createVariant(product.id, {
        name: 'A',
        sku: `sku-${randomUUID()}`,
        price: 10,
      });
      const secondProductState = await service.createVariant(product.id, {
        name: 'B',
        sku: `sku-${randomUUID()}`,
        price: 10,
      });
      const variantAId = withVariants.variants[0].id;
      const variantBId = secondProductState.variants[1].id;
      const sku = `sku-${randomUUID()}`;

      const results = await Promise.allSettled([
        service.updateVariant(variantAId, { sku }),
        service.updateVariant(variantBId, { sku }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(ConflictException);
    });
  });

  describe('generateUniqueVariantSku', () => {
    it('generates a SKU matching the standard prefix/length/alphabet format', async () => {
      const sku = await service.generateUniqueVariantSku();
      const alphabetPattern = `[${PRODUCT_VARIANT_SKU_RANDOM_ALPHABET}]{${PRODUCT_VARIANT_SKU_RANDOM_LENGTH}}`;
      expect(sku).toMatch(
        new RegExp(`^${PRODUCT_VARIANT_SKU_PREFIX}${alphabetPattern}$`),
      );
    });

    it('retries when the first candidate is already taken', async () => {
      const product = await createProduct(ProductType.VARIANT_BASED);
      const takenSku = `sku-${randomUUID()}`;
      await service.createVariant(product.id, {
        name: 'A',
        sku: takenSku,
        price: 10,
      });
      const freeSku = `sku-${randomUUID()}`;
      const candidateFactory = jest
        .fn<string, []>()
        .mockReturnValueOnce(takenSku)
        .mockReturnValueOnce(freeSku);

      const result = await service.generateUniqueVariantSku(candidateFactory);

      expect(result).toBe(freeSku);
      expect(candidateFactory).toHaveBeenCalledTimes(2);
    });

    it('throws after exhausting all attempts when every candidate is taken', async () => {
      const product = await createProduct(ProductType.VARIANT_BASED);
      const takenSku = `sku-${randomUUID()}`;
      await service.createVariant(product.id, {
        name: 'A',
        sku: takenSku,
        price: 10,
      });
      const candidateFactory = jest.fn<string, []>().mockReturnValue(takenSku);

      await expect(
        service.generateUniqueVariantSku(candidateFactory),
      ).rejects.toThrow(ConflictException);
      expect(candidateFactory).toHaveBeenCalledTimes(
        PRODUCT_VARIANT_SKU_GENERATION_MAX_ATTEMPTS,
      );
    });
  });

  describe('removeVariant', () => {
    it('deletes a variant with no provisioned units', async () => {
      const product = await createProduct(ProductType.VARIANT_BASED);
      const withVariant = await service.createVariant(product.id, {
        name: 'A',
        sku: `sku-${randomUUID()}`,
        price: 10,
      });
      const variantId = withVariant.variants[0].id;

      const result = await service.removeVariant(variantId);
      expect(result.variants).toHaveLength(0);
    });

    it('throws ConflictException when the variant has provisioned units', async () => {
      const product = await createProduct(ProductType.VARIANT_BASED);
      const withVariant = await service.createVariant(product.id, {
        name: 'A',
        sku: `sku-${randomUUID()}`,
        price: 10,
      });
      const variantId = withVariant.variants[0].id;
      const unit = await prisma.productUnit.create({
        data: { variantId, code: randomUUID() },
      });

      await expect(service.removeVariant(variantId)).rejects.toThrow(
        ConflictException,
      );

      await prisma.productUnit.delete({ where: { id: unit.id } });
    });
  });

  describe('addProductMedia / removeMedia', () => {
    it('adds a gallery image to a product', async () => {
      const product = await createProduct();
      const updated = await service.addProductMedia(
        product.id,
        { purpose: ProductMediaPurpose.GALLERY },
        makeImageFile(),
      );
      expect(updated.media).toHaveLength(1);
      expect(updated.media[0].purpose).toBe(ProductMediaPurpose.GALLERY);
      seededMediaIds.push(updated.media[0].mediaId);
    });

    it('replaces the existing PREVIEW media instead of adding a second one', async () => {
      const product = await createProduct();
      const first = await service.addProductMedia(
        product.id,
        { purpose: ProductMediaPurpose.PREVIEW },
        makeImageFile('first'),
      );
      const firstMediaId = first.media[0].mediaId;

      const second = await service.addProductMedia(
        product.id,
        { purpose: ProductMediaPurpose.PREVIEW },
        makeImageFile('second'),
      );

      expect(second.media).toHaveLength(1);
      expect(second.media[0].mediaId).not.toBe(firstMediaId);
      seededMediaIds.push(second.media[0].mediaId);

      const orphaned = await prisma.media.findUnique({
        where: { id: firstMediaId },
      });
      expect(orphaned).toBeNull();
    });

    it('removes a media entry and its underlying Media row', async () => {
      const product = await createProduct();
      const withMedia = await service.addProductMedia(
        product.id,
        { purpose: ProductMediaPurpose.GALLERY },
        makeImageFile(),
      );
      const entry = withMedia.media[0];

      const result = await service.removeMedia(entry.id);
      expect(result.media).toHaveLength(0);

      const mediaRow = await prisma.media.findUnique({
        where: { id: entry.mediaId },
      });
      expect(mediaRow).toBeNull();
    });

    it('throws UnsupportedMediaTypeException for a disallowed file type', async () => {
      const product = await createProduct();
      await expect(
        service.addProductMedia(
          product.id,
          { purpose: ProductMediaPurpose.GALLERY },
          makeImageFile('bytes', {
            originalname: 'file.txt',
            mimetype: 'text/plain',
          }),
        ),
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });

    it('throws PayloadTooLargeException for an oversized file', async () => {
      const product = await createProduct();
      const oversized = makeImageFile('x'.repeat(10), {
        size: PRODUCT_MEDIA_MAX_SIZE_BYTES + 1,
      });
      await expect(
        service.addProductMedia(
          product.id,
          { purpose: ProductMediaPurpose.GALLERY },
          oversized,
        ),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('throws BadRequestException once the gallery cap is reached', async () => {
      const product = await createProduct();
      for (let i = 0; i < PRODUCT_MEDIA_GALLERY_MAX_PER_SCOPE; i++) {
        const result = await service.addProductMedia(
          product.id,
          { purpose: ProductMediaPurpose.GALLERY },
          makeImageFile(`img-${i}`),
        );
        seededMediaIds.push(result.media[result.media.length - 1].mediaId);
      }

      await expect(
        service.addProductMedia(
          product.id,
          { purpose: ProductMediaPurpose.GALLERY },
          makeImageFile('one-too-many'),
        ),
      ).rejects.toThrow(BadRequestException);
    }, 30_000);
  });
});
