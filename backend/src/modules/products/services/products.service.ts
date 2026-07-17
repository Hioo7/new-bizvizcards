import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { extname } from 'path';
import { MediaService } from '../../../common/media/media.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ProductMediaPurpose,
  ProductType,
} from '../../../generated/prisma/client';
import type { CreateProductDto } from '../dto/create-product.dto';
import type { UpdateProductDto } from '../dto/update-product.dto';
import type { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import type { UpdateProductVariantDto } from '../dto/update-product-variant.dto';
import type { AddProductMediaDto } from '../dto/add-product-media.dto';
import type { ListProductsQueryDto } from '../dto/list-products-query.dto';
import {
  PRODUCT_LIST_DEFAULT_PAGE,
  PRODUCT_LIST_DEFAULT_PAGE_SIZE,
  PRODUCT_MEDIA_ALLOWED_EXTENSIONS,
  PRODUCT_MEDIA_ALLOWED_MIME_TYPE_PATTERN,
  PRODUCT_MEDIA_GALLERY_MAX_PER_SCOPE,
  PRODUCT_MEDIA_MAX_SIZE_BYTES,
  PRODUCT_STORAGE_KEY_PREFIX,
} from '../products.constants';

const PRODUCT_INCLUDE = {
  variants: {
    include: { media: { include: { media: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  media: { include: { media: true } },
};

type FullProduct = NonNullable<
  Awaited<ReturnType<ProductsService['findByIdOrThrow']>>
>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async list(query: ListProductsQueryDto) {
    const page = query.page ?? PRODUCT_LIST_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? PRODUCT_LIST_DEFAULT_PAGE_SIZE;
    const where = {
      ...(query.productType && { productType: query.productType }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((product) => this.toResponse(product)),
      total,
      page,
      pageSize,
    };
  }

  async getById(id: string) {
    const product = await this.findByIdOrThrow(id);
    return this.toResponse(product);
  }

  async create(dto: CreateProductDto, actorAccountId: string) {
    this.assertPriceMatchesProductType(dto.productType, dto.price);
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { accountId: actorAccountId },
    });
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        productType: dto.productType,
        price: dto.price,
        createdByEmployeeId: employee.id,
      },
    });
    return this.getById(product.id);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findByIdOrThrow(id);
    if (dto.price !== undefined) {
      this.assertPriceMatchesProductType(product.productType, dto.price);
    }
    await this.prisma.product.update({ where: { id }, data: dto });
    return this.getById(id);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findByIdOrThrow(id);
    // A VARIANT_BASED product's units hang off its variants (variantId),
    // never productId directly — must check both, or deleting the product
    // would cascade away provisioned units unchecked.
    await this.assertNoProvisionedUnitsForProduct(
      id,
      product.variants.map((variant) => variant.id),
    );
    const mediaIds = this.collectMediaIds(product);
    await this.prisma.product.delete({ where: { id } });
    await Promise.allSettled(
      mediaIds.map((mediaId) => this.mediaService.delete(mediaId)),
    );
  }

  async createVariant(productId: string, dto: CreateProductVariantDto) {
    const product = await this.findByIdOrThrow(productId);
    this.assertVariantBased(product);
    await this.assertSkuAvailable(dto.sku);

    await this.prisma.productVariant.create({
      data: { productId, name: dto.name, sku: dto.sku, price: dto.price },
    });
    return this.getById(productId);
  }

  async updateVariant(variantId: string, dto: UpdateProductVariantDto) {
    const variant = await this.findVariantByIdOrThrow(variantId);
    if (dto.sku && dto.sku !== variant.sku) {
      await this.assertSkuAvailable(dto.sku);
    }
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto,
    });
    return this.getById(variant.productId);
  }

  async removeVariant(variantId: string) {
    const variant = await this.findVariantByIdOrThrow(variantId);
    await this.assertNoProvisionedUnits({ variantId });
    const mediaIds = variant.media.map((entry) => entry.mediaId);
    await this.prisma.productVariant.delete({ where: { id: variantId } });
    await Promise.allSettled(
      mediaIds.map((mediaId) => this.mediaService.delete(mediaId)),
    );
    return this.getById(variant.productId);
  }

  async addProductMedia(
    productId: string,
    dto: AddProductMediaDto,
    file: Express.Multer.File,
  ) {
    const product = await this.findByIdOrThrow(productId);
    await this.addMedia({ productId }, product.media.length, dto, file);
    return this.getById(productId);
  }

  async addVariantMedia(
    variantId: string,
    dto: AddProductMediaDto,
    file: Express.Multer.File,
  ) {
    const variant = await this.findVariantByIdOrThrow(variantId);
    await this.addMedia({ variantId }, variant.media.length, dto, file);
    return this.getById(variant.productId);
  }

  async removeMedia(productMediaId: string) {
    const entry = await this.prisma.productMedia.findUnique({
      where: { id: productMediaId },
    });
    if (!entry) {
      throw new NotFoundException('Product media not found');
    }
    const productId =
      entry.productId ??
      (
        await this.prisma.productVariant.findUniqueOrThrow({
          where: { id: entry.variantId! },
        })
      ).productId;

    await this.prisma.productMedia.delete({ where: { id: productMediaId } });
    await this.mediaService.delete(entry.mediaId);
    return this.getById(productId);
  }

  // ── media upload ─────────────────────────────────────────────────────────

  private async addMedia(
    scope: { productId: string } | { variantId: string },
    existingCount: number,
    dto: AddProductMediaDto,
    file: Express.Multer.File,
  ): Promise<void> {
    this.assertValidMediaFile(file);

    if (dto.purpose === ProductMediaPurpose.PREVIEW) {
      const existingPreview = await this.prisma.productMedia.findFirst({
        where: { ...scope, purpose: ProductMediaPurpose.PREVIEW },
      });
      if (existingPreview) {
        await this.prisma.productMedia.delete({
          where: { id: existingPreview.id },
        });
        await this.mediaService.delete(existingPreview.mediaId);
      }
    } else if (existingCount >= PRODUCT_MEDIA_GALLERY_MAX_PER_SCOPE) {
      throw new BadRequestException(
        `Maximum of ${PRODUCT_MEDIA_GALLERY_MAX_PER_SCOPE} gallery images reached`,
      );
    }

    const keyPrefix = `${PRODUCT_STORAGE_KEY_PREFIX}/${'productId' in scope ? scope.productId : scope.variantId}`;
    const media = await this.mediaService.upload({
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      extension: extname(file.originalname).slice(1).toLowerCase(),
      keyPrefix,
    });

    await this.prisma.productMedia.create({
      data: {
        ...scope,
        mediaId: media.id,
        purpose: dto.purpose,
        sortOrder: dto.sortOrder ?? existingCount,
      },
    });
  }

  private assertValidMediaFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const extension = extname(file.originalname).slice(1).toLowerCase();
    if (
      !PRODUCT_MEDIA_ALLOWED_EXTENSIONS.includes(extension) ||
      !PRODUCT_MEDIA_ALLOWED_MIME_TYPE_PATTERN.test(file.mimetype)
    ) {
      throw new UnsupportedMediaTypeException();
    }
    if (file.size > PRODUCT_MEDIA_MAX_SIZE_BYTES) {
      throw new PayloadTooLargeException();
    }
  }

  // ── assertions ───────────────────────────────────────────────────────────

  private assertVariantBased(product: FullProduct): void {
    if (product.productType !== ProductType.VARIANT_BASED) {
      throw new BadRequestException(
        'This product is standalone and does not support variants',
      );
    }
  }

  // STANDALONE products are priced directly; VARIANT_BASED products are
  // priced per-variant instead, so a top-level price would be meaningless
  // (and ambiguous next to each variant's own price).
  private assertPriceMatchesProductType(
    productType: ProductType,
    price: number | undefined,
  ): void {
    if (productType === ProductType.STANDALONE && price === undefined) {
      throw new BadRequestException(
        'price is required for a standalone product',
      );
    }
    if (productType === ProductType.VARIANT_BASED && price !== undefined) {
      throw new BadRequestException(
        'price is not applicable to a variant-based product; set it on each variant instead',
      );
    }
  }

  private async assertSkuAvailable(sku: string): Promise<void> {
    const existing = await this.prisma.productVariant.findUnique({
      where: { sku },
    });
    if (existing) {
      throw new ConflictException('SKU already in use');
    }
  }

  private async assertNoProvisionedUnits(
    scope: { productId: string } | { variantId: string },
  ): Promise<void> {
    const count = await this.prisma.productUnit.count({ where: scope });
    this.throwIfAnyProvisioned(count);
  }

  /**
   * A STANDALONE product's units hang off productId directly; a
   * VARIANT_BASED product's units hang off each variant's variantId instead
   * (see ProductUnit.productId/variantId). Deleting the product cascades
   * away both, so this must count across both scopes, not just productId.
   */
  private async assertNoProvisionedUnitsForProduct(
    productId: string,
    variantIds: string[],
  ): Promise<void> {
    const count = await this.prisma.productUnit.count({
      where: { OR: [{ productId }, { variantId: { in: variantIds } }] },
    });
    this.throwIfAnyProvisioned(count);
  }

  private throwIfAnyProvisioned(count: number): void {
    if (count > 0) {
      throw new ConflictException(
        `Cannot delete: ${count} physical unit(s) have already been provisioned`,
      );
    }
  }

  // ── catalog resolution (used by cart/orders) ────────────────────────────

  /**
   * Resolves a cart/order line reference (exactly one of productId/variantId,
   * service-enforced by the caller's DTO) to its current sellable details —
   * name, sku, price, and whether the parent product is active. Used by
   * CartService (live pricing) and OrdersService (price snapshotting at
   * checkout) so both stay consistent with how a Product's price is split
   * across STANDALONE vs. VARIANT_BASED (see product.prisma).
   */
  async resolveSellable(ref: { productId?: string; variantId?: string }) {
    if (ref.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: ref.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      if (product.productType !== ProductType.STANDALONE) {
        throw new BadRequestException(
          'This product requires selecting a variant',
        );
      }
      if (product.price === null) {
        throw new BadRequestException('Product has no price set');
      }
      return {
        productId: product.id,
        variantId: null,
        productName: product.name,
        variantName: null,
        sku: null,
        price: product.price,
        isActive: product.isActive,
      };
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: ref.variantId! },
      include: { product: true },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }
    return {
      productId: variant.productId,
      variantId: variant.id,
      productName: variant.product.name,
      variantName: variant.name,
      sku: variant.sku,
      price: variant.price,
      isActive: variant.product.isActive,
    };
  }

  // ── read helpers ─────────────────────────────────────────────────────────

  private async findByIdOrThrow(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private async findVariantByIdOrThrow(id: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      include: { media: { include: { media: true } } },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }
    return variant;
  }

  private collectMediaIds(product: FullProduct): string[] {
    return [
      ...product.media.map((entry) => entry.mediaId),
      ...product.variants.flatMap((variant) =>
        variant.media.map((entry) => entry.mediaId),
      ),
    ];
  }

  private toResponse(product: FullProduct) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      productType: product.productType,
      price: product.price !== null ? Number(product.price) : null,
      isActive: product.isActive,
      createdByEmployeeId: product.createdByEmployeeId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      media: product.media.map((entry) => this.mediaEntryToResponse(entry)),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: Number(variant.price),
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
        media: variant.media.map((entry) => this.mediaEntryToResponse(entry)),
      })),
    };
  }

  private mediaEntryToResponse(entry: {
    id: string;
    mediaId: string;
    purpose: ProductMediaPurpose;
    sortOrder: number;
    media: Parameters<MediaService['getPublicUrl']>[0];
  }) {
    return {
      id: entry.id,
      mediaId: entry.mediaId,
      purpose: entry.purpose,
      sortOrder: entry.sortOrder,
      url: this.mediaService.getPublicUrl(entry.media),
    };
  }
}
