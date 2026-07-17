import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddressesService } from '../../addresses/services/addresses.service';
import { CartService } from '../../cart/services/cart.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { OrderStatus, Prisma } from '../../../generated/prisma/client';
import type { ListOrdersQueryDto } from '../dto/list-orders-query.dto';
import type { PlaceOrderDto } from '../dto/place-order.dto';
import type { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import {
  ORDER_LIST_DEFAULT_PAGE,
  ORDER_LIST_DEFAULT_PAGE_SIZE,
  ORDER_STATUS_TRANSITIONS,
} from '../orders.constants';

const ORDER_INCLUDE = {
  items: true,
  statusHistory: {
    include: { changedByEmployee: { include: { account: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

type FullOrder = NonNullable<
  Awaited<ReturnType<OrdersService['findByIdOrThrow']>>
>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly addressesService: AddressesService,
    private readonly cartService: CartService,
  ) {}

  /**
   * Converts the customer's current cart into an immutable Order. Every
   * field needed to display the order later — buyer contact, shipping
   * address, item names/sku/price — is copied onto Order/OrderItem as flat
   * snapshot columns in the same transaction, so later edits to
   * Customer/Address/Product/ProductVariant never change this order's
   * history (see order.prisma).
   */
  async placeOrderForCustomer(customerId: string, dto: PlaceOrderDto) {
    const cart = await this.cartService.getOrCreateCart(customerId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.addressesService.getOwnedOrThrow(
      customerId,
      dto.addressId,
    );

    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      include: { account: true },
    });

    const itemsData = cart.items.map((item) => {
      const unitPrice = item.product ? item.product.price : item.variant?.price;
      if (!unitPrice) {
        throw new BadRequestException(
          'One or more cart items no longer have a price set',
        );
      }
      return {
        productId: item.productId,
        variantId: item.variantId,
        productNameSnapshot:
          item.product?.name ?? item.variant?.product.name ?? '',
        variantNameSnapshot: item.variant?.name ?? null,
        skuSnapshot: item.variant?.sku ?? null,
        unitPriceSnapshot: unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice.times(item.quantity),
      };
    });
    const totalAmount = itemsData.reduce(
      (sum, item) => sum.plus(item.lineTotal),
      new Prisma.Decimal(0),
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerId,
          buyerName: customer.account.name,
          buyerEmail: customer.account.email,
          shippingAddressId: address.id,
          shippingLabel: address.label,
          shippingContactName: address.contactName,
          shippingContactPhoneCountryDialCode:
            address.contactPhoneCountryDialCode,
          shippingContactPhoneNumber: address.contactPhoneNumber,
          shippingLine1: address.line1,
          shippingLine2: address.line2,
          shippingCity: address.city,
          shippingState: address.state,
          shippingCountry: address.country,
          shippingPincode: address.pincode,
          shippingLatitude: address.latitude,
          shippingLongitude: address.longitude,
          totalAmount,
          items: { create: itemsData },
          statusHistory: {
            create: { fromStatus: null, toStatus: OrderStatus.PLACED },
          },
        },
      });
      return created;
    });

    await this.cartService.clear(customerId);
    return this.getForCustomer(customerId, order.id);
  }

  async listForCustomer(customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: ORDER_INCLUDE,
      orderBy: { placedAt: 'desc' },
    });
    return orders.map((order) => this.toResponse(order));
  }

  async getForCustomer(customerId: string, orderId: string) {
    const order = await this.findByIdOrThrow(orderId);
    if (order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }
    return this.toResponse(order);
  }

  async listForEmployee(query: ListOrdersQueryDto) {
    const page = query.page ?? ORDER_LIST_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? ORDER_LIST_DEFAULT_PAGE_SIZE;
    const where = {
      ...(query.status && { status: query.status }),
      ...(query.customerId && { customerId: query.customerId }),
      ...((query.placedFrom || query.placedTo) && {
        placedAt: {
          ...(query.placedFrom && { gte: query.placedFrom }),
          ...(query.placedTo && { lte: query.placedTo }),
        },
      }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { placedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((order) => this.toResponse(order)),
      total,
      page,
      pageSize,
    };
  }

  async getForEmployee(orderId: string) {
    const order = await this.findByIdOrThrow(orderId);
    return this.toResponse(order);
  }

  async updateStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    actorAccountId: string,
  ) {
    const order = await this.findByIdOrThrow(orderId);
    const allowed = ORDER_STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot move an order from ${order.status} to ${dto.status}`,
      );
    }
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { accountId: actorAccountId },
    });

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: dto.status },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: dto.status,
          changedByEmployeeId: employee.id,
        },
      }),
    ]);

    return this.getForEmployee(orderId);
  }

  private async findByIdOrThrow(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private toResponse(order: FullOrder) {
    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      shippingAddress: {
        label: order.shippingLabel,
        contactName: order.shippingContactName,
        contactPhoneCountryDialCode: order.shippingContactPhoneCountryDialCode,
        contactPhoneNumber: order.shippingContactPhoneNumber,
        line1: order.shippingLine1,
        line2: order.shippingLine2,
        city: order.shippingCity,
        state: order.shippingState,
        country: order.shippingCountry,
        pincode: order.shippingPincode,
        latitude: order.shippingLatitude
          ? Number(order.shippingLatitude)
          : null,
        longitude: order.shippingLongitude
          ? Number(order.shippingLongitude)
          : null,
      },
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productNameSnapshot,
        variantName: item.variantNameSnapshot,
        sku: item.skuSnapshot,
        unitPrice: Number(item.unitPriceSnapshot),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
      })),
      totalAmount: Number(order.totalAmount),
      statusHistory: order.statusHistory.map((entry) => ({
        id: entry.id,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        changedByEmployeeName: entry.changedByEmployee?.account.name ?? null,
        createdAt: entry.createdAt,
      })),
      placedAt: order.placedAt,
      updatedAt: order.updatedAt,
    };
  }
}
