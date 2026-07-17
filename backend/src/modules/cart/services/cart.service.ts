import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ProductsService } from '../../products/services/products.service';
import type { AddCartItemDto } from '../dto/add-cart-item.dto';
import type { UpdateCartItemDto } from '../dto/update-cart-item.dto';

const CART_INCLUDE = {
  items: {
    include: { product: true, variant: { include: { product: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

type FullCart = NonNullable<
  Awaited<ReturnType<CartService['getOrCreateCart']>>
>;

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async getForCustomer(customerId: string) {
    const cart = await this.getOrCreateCart(customerId);
    return this.toResponse(cart);
  }

  async addItem(customerId: string, dto: AddCartItemDto) {
    const sellable = await this.productsService.resolveSellable({
      productId: dto.productId,
      variantId: dto.variantId,
    });
    if (!sellable.isActive) {
      throw new BadRequestException('This product is not currently available');
    }
    const cart = await this.getOrCreateCart(customerId);

    const existing = cart.items.find(
      (item) =>
        item.productId === sellable.productId &&
        item.variantId === sellable.variantId,
    );
    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: sellable.productId,
          variantId: sellable.variantId,
          quantity: dto.quantity,
        },
      });
    }
    return this.getForCustomer(customerId);
  }

  async updateItemQuantity(
    customerId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    await this.getOwnedItemOrThrow(customerId, itemId);
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
    return this.getForCustomer(customerId);
  }

  async removeItem(customerId: string, itemId: string) {
    await this.getOwnedItemOrThrow(customerId, itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getForCustomer(customerId);
  }

  async clear(customerId: string): Promise<void> {
    const cart = await this.getOrCreateCart(customerId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  // Exported for OrdersService, which needs the raw cart (with resolved
  // product/variant relations) to snapshot each item at checkout time.
  async getOrCreateCart(customerId: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { customerId },
      include: CART_INCLUDE,
    });
    if (existing) {
      return existing;
    }
    return this.prisma.cart.create({
      data: { customerId },
      include: CART_INCLUDE,
    });
  }

  // Throws 404 (not 403) either way so a foreign cart item's existence isn't
  // leaked to a customer who doesn't own it — same pattern as
  // EcardsController.getOwnedCardOrThrow.
  private async getOwnedItemOrThrow(
    customerId: string,
    itemId: string,
  ): Promise<void> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!item || item.cart.customerId !== customerId) {
      throw new NotFoundException('Cart item not found');
    }
  }

  private toResponse(cart: FullCart) {
    const items = cart.items.map((item) => {
      const price = item.product?.price ?? item.variant?.price ?? null;
      const unitPrice = price ? Number(price) : 0;
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product?.name ?? item.variant?.product.name ?? '',
        variantName: item.variant?.name ?? null,
        sku: item.variant?.sku ?? null,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      };
    });
    return {
      id: cart.id,
      items,
      totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
      updatedAt: cart.updatedAt,
    };
  }
}
