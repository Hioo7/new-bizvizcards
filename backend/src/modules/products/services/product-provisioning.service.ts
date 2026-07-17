import { randomBytes, randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ProductType } from '../../../generated/prisma/client';
import type { ProductUnitModel } from '../../../generated/prisma/models';
import type { GenerateProductUnitsDto } from '../dto/generate-product-units.dto';
import type { CreatePrintBatchDto } from '../dto/create-print-batch.dto';
import type { UpdatePrintStatusDto } from '../dto/update-print-status.dto';
import type { ListProductUnitsQueryDto } from '../dto/list-product-units-query.dto';
import {
  PRODUCT_UNIT_CODE_RANDOM_BYTES,
  PRODUCT_UNIT_LIST_DEFAULT_PAGE,
  PRODUCT_UNIT_LIST_DEFAULT_PAGE_SIZE,
  buildProductUnitResolverUrl,
} from '../products.constants';

type UnitScope = { productId: string } | { variantId: string };

@Injectable()
export class ProductProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  async generateForProduct(productId: string, dto: GenerateProductUnitsDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.productType !== ProductType.STANDALONE) {
      throw new BadRequestException(
        'This product has variants — generate units on a variant instead',
      );
    }
    return this.generate({ productId }, dto.quantity);
  }

  async generateForVariant(variantId: string, dto: GenerateProductUnitsDto) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }
    return this.generate({ variantId }, dto.quantity);
  }

  async list(query: ListProductUnitsQueryDto) {
    const page = query.page ?? PRODUCT_UNIT_LIST_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? PRODUCT_UNIT_LIST_DEFAULT_PAGE_SIZE;
    const where = {
      ...(query.productId && { productId: query.productId }),
      ...(query.variantId && { variantId: query.variantId }),
      ...(query.printed !== undefined && {
        printedAt: query.printed ? { not: null } : null,
      }),
      ...(query.linked !== undefined && {
        link: query.linked ? { isNot: null } : { is: null },
      }),
    };

    const [units, total] = await Promise.all([
      this.prisma.productUnit.findMany({
        where,
        include: { link: true },
        orderBy: { provisionedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.productUnit.count({ where }),
    ]);

    return {
      units: units.map((unit) => this.toResponse(unit, unit.link != null)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Atomically claims `quantity` never-printed units for one manufacturing
   * run: SELECT ... FOR UPDATE SKIP LOCKED inside a transaction so two
   * concurrent print-batch requests can never hand the same code to two
   * different runs, then stamps them with printedAt + a shared printBatchId.
   * Every later batch only ever draws from units still printedAt = null.
   */
  async createPrintBatch(dto: CreatePrintBatchDto) {
    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    } else {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (!variant) {
        throw new NotFoundException('Product variant not found');
      }
    }

    const printBatchId = randomUUID();
    const productId = dto.productId;
    const variantId = dto.variantId;
    const quantity = dto.quantity;

    const units = await this.prisma.$transaction(async (tx) => {
      const rows = productId
        ? await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM "ProductUnit"
            WHERE "productId" = ${productId} AND "printedAt" IS NULL
            ORDER BY "provisionedAt" ASC
            LIMIT ${quantity}
            FOR UPDATE SKIP LOCKED
          `
        : await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM "ProductUnit"
            WHERE "variantId" = ${variantId} AND "printedAt" IS NULL
            ORDER BY "provisionedAt" ASC
            LIMIT ${quantity}
            FOR UPDATE SKIP LOCKED
          `;

      if (rows.length < quantity) {
        throw new BadRequestException(
          `Only ${rows.length} unprinted unit(s) available, requested ${quantity}`,
        );
      }

      const ids = rows.map((row) => row.id);
      await tx.productUnit.updateMany({
        where: { id: { in: ids } },
        data: { printedAt: new Date(), printBatchId },
      });

      return tx.productUnit.findMany({ where: { id: { in: ids } } });
    });

    return {
      printBatchId,
      units: units.map((unit) => this.toResponse(unit, false)),
    };
  }

  async updatePrintStatus(unitId: string, dto: UpdatePrintStatusDto) {
    const unit = await this.prisma.productUnit.findUnique({
      where: { id: unitId },
      include: { link: true },
    });
    if (!unit) {
      throw new NotFoundException('Product unit not found');
    }

    const updated = await this.prisma.productUnit.update({
      where: { id: unitId },
      data: dto.printed
        ? { printedAt: unit.printedAt ?? new Date() }
        : { printedAt: null, printBatchId: null },
    });

    return this.toResponse(updated, unit.link != null);
  }

  private async generate(scope: UnitScope, quantity: number) {
    // 120-bit random codes (15 bytes -> 20 base64url chars): collision
    // probability across any realistic batch size is astronomically small,
    // so a plain createMany (no per-row uniqueness retry) is safe — same
    // trade-off as UUID generation.
    const data = Array.from({ length: quantity }, () => ({
      ...scope,
      code: randomBytes(PRODUCT_UNIT_CODE_RANDOM_BYTES).toString('base64url'),
    }));
    await this.prisma.productUnit.createMany({ data });

    return this.list({
      ...scope,
      page: PRODUCT_UNIT_LIST_DEFAULT_PAGE,
      pageSize: quantity,
    });
  }

  private toResponse(unit: ProductUnitModel, isLinked: boolean) {
    return {
      id: unit.id,
      productId: unit.productId,
      variantId: unit.variantId,
      code: unit.code,
      url: buildProductUnitResolverUrl(
        this.appConfig.publicAppBaseUrl,
        unit.code,
      ),
      printedAt: unit.printedAt,
      printBatchId: unit.printBatchId,
      provisionedAt: unit.provisionedAt,
      isLinked,
    };
  }
}
