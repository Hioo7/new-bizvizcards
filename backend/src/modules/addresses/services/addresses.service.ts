import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { Address } from '../../../generated/prisma/client';
import type { CreateAddressDto } from '../dto/create-address.dto';
import type { UpdateAddressDto } from '../dto/update-address.dto';
import { ADDRESS_MAX_PER_CUSTOMER } from '../addresses.constants';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForCustomer(customerId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    });
    return addresses.map((address) => this.toResponse(address));
  }

  async create(customerId: string, dto: CreateAddressDto) {
    const count = await this.prisma.address.count({ where: { customerId } });
    if (count >= ADDRESS_MAX_PER_CUSTOMER) {
      throw new BadRequestException(
        `Maximum of ${ADDRESS_MAX_PER_CUSTOMER} addresses reached`,
      );
    }
    const address = await this.prisma.address.create({
      data: { customerId, ...dto },
    });
    return this.toResponse(address);
  }

  async update(customerId: string, addressId: string, dto: UpdateAddressDto) {
    await this.getOwnedOrThrow(customerId, addressId);
    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
    return this.toResponse(address);
  }

  async remove(customerId: string, addressId: string): Promise<void> {
    await this.getOwnedOrThrow(customerId, addressId);
    await this.prisma.address.delete({ where: { id: addressId } });
  }

  // Fetches the address by id and confirms it belongs to the given customer,
  // throwing 404 (not 403) either way so a foreign address's existence isn't
  // leaked to a customer who doesn't own it — same pattern as
  // EcardsController.getOwnedCardOrThrow. Exported for OrdersService, which
  // needs the raw Address row (not the response shape) to snapshot at
  // checkout time.
  async getOwnedOrThrow(
    customerId: string,
    addressId: string,
  ): Promise<Address> {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address || address.customerId !== customerId) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  private toResponse(address: Address) {
    return {
      id: address.id,
      label: address.label,
      contactName: address.contactName,
      contactPhoneCountryDialCode: address.contactPhoneCountryDialCode,
      contactPhoneNumber: address.contactPhoneNumber,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode,
      latitude: address.latitude ? Number(address.latitude) : null,
      longitude: address.longitude ? Number(address.longitude) : null,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}
