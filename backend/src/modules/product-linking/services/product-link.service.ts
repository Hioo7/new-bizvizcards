import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LinkedCardType } from '../../../generated/prisma/client';
import type { LinkProductUnitDto } from '../dto/link-product-unit.dto';

@Injectable()
export class ProductLinkService {
  constructor(private readonly prisma: PrismaService) {}

  async claim(code: string, customerId: string, dto: LinkProductUnitDto) {
    const unit = await this.findUnitByCodeOrThrow(code);
    if (unit.link) {
      throw new ConflictException('This product is already linked');
    }
    await this.assertCardOwnedByCustomer(dto, customerId);

    await this.prisma.productUnitLink.create({
      data: {
        productUnitId: unit.id,
        customerId,
        cardType: dto.cardType,
        ecardId: dto.cardType === LinkedCardType.ECARD ? dto.cardId : null,
        smartCardId:
          dto.cardType === LinkedCardType.SMART_CARD ? dto.cardId : null,
      },
    });
  }

  async relink(code: string, customerId: string, dto: LinkProductUnitDto) {
    const unit = await this.findUnitByCodeOrThrow(code);
    if (!unit.link) {
      throw new NotFoundException(
        'This product is not linked yet — claim it first',
      );
    }
    if (unit.link.customerId !== customerId) {
      throw new ForbiddenException('You do not own this product');
    }
    await this.assertCardOwnedByCustomer(dto, customerId);

    await this.prisma.productUnitLink.update({
      where: { id: unit.link.id },
      data: {
        cardType: dto.cardType,
        ecardId: dto.cardType === LinkedCardType.ECARD ? dto.cardId : null,
        smartCardId:
          dto.cardType === LinkedCardType.SMART_CARD ? dto.cardId : null,
        linkedAt: new Date(),
      },
    });
  }

  async unlink(code: string, customerId: string): Promise<void> {
    const unit = await this.findUnitByCodeOrThrow(code);
    if (!unit.link) {
      throw new NotFoundException('This product is not linked');
    }
    if (unit.link.customerId !== customerId) {
      throw new ForbiddenException('You do not own this product');
    }

    await this.prisma.productUnitLink.delete({ where: { id: unit.link.id } });
  }

  private async findUnitByCodeOrThrow(code: string) {
    const unit = await this.prisma.productUnit.findUnique({
      where: { code },
      include: { link: true },
    });
    if (!unit) {
      throw new NotFoundException('Product not found');
    }
    return unit;
  }

  private async assertCardOwnedByCustomer(
    dto: LinkProductUnitDto,
    customerId: string,
  ): Promise<void> {
    if (dto.cardType === LinkedCardType.ECARD) {
      const ecard = await this.prisma.eCard.findUnique({
        where: { id: dto.cardId },
      });
      if (!ecard || ecard.customerId !== customerId) {
        throw new BadRequestException(
          'cardId does not reference an e-card you own',
        );
      }
      return;
    }

    const smartCard = await this.prisma.smartCard.findUnique({
      where: { id: dto.cardId },
    });
    if (!smartCard || smartCard.customerId !== customerId) {
      throw new BadRequestException(
        'cardId does not reference a smart card you own',
      );
    }
  }
}
