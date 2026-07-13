import { Injectable } from '@nestjs/common';
import { MediaService } from '../../../common/media/media.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CustomerModel } from '../../../generated/prisma/models';
import {
  CUSTOMER_LIST_DEFAULT_PAGE,
  CUSTOMER_LIST_DEFAULT_PAGE_SIZE,
  PFP_STORAGE_KEY_PREFIX,
} from '../customers.constants';
import type { ListCustomersQueryDto } from '../dto/list-customers-query.dto';

export interface ProfilePictureUpload {
  buffer: Buffer;
  contentType: string;
  originalName: string;
  extension: string;
}

export interface ProfilePictureReplaceResult {
  customer: CustomerModel;
  pfpUrl: string;
}

export interface CustomerListItem {
  id: string;
  name: string;
  email: string;
  pfpUrl: string | null;
}

export interface CustomerListResult {
  customers: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  getByAccountId(accountId: string): Promise<CustomerModel> {
    return this.prisma.customer.findUniqueOrThrow({ where: { accountId } });
  }

  async list(query: ListCustomersQueryDto): Promise<CustomerListResult> {
    const page = query.page ?? CUSTOMER_LIST_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? CUSTOMER_LIST_DEFAULT_PAGE_SIZE;

    const where = {
      ...(query.search && {
        account: {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        },
      }),
    };

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: { account: true, pfpMedia: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.account.name,
        email: customer.account.email,
        pfpUrl: customer.pfpMedia
          ? this.mediaService.getPublicUrl(customer.pfpMedia)
          : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async replaceProfilePicture(
    customerId: string,
    upload: ProfilePictureUpload,
  ): Promise<ProfilePictureReplaceResult> {
    const existing = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });

    const newMedia = await this.mediaService.upload({
      ...upload,
      keyPrefix: `${PFP_STORAGE_KEY_PREFIX}/${customerId}`,
    });
    const pfpUrl = this.mediaService.getPublicUrl(newMedia);

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: { pfpMediaId: newMedia.id },
    });

    if (existing.pfpMediaId) {
      await this.mediaService.delete(existing.pfpMediaId);
    }

    return { customer: updated, pfpUrl };
  }

  async removeProfilePicture(customerId: string): Promise<CustomerModel> {
    const existing = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });

    if (!existing.pfpMediaId) {
      return existing;
    }

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: { pfpMediaId: null },
    });

    await this.mediaService.delete(existing.pfpMediaId);

    return updated;
  }
}
