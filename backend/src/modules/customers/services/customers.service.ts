import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { hashPassword } from 'better-auth/crypto';
import {
  CREDENTIAL_PROVIDER_ID,
  CUSTOMER_AUTH,
} from '../../../common/auth/auth.constants';
import type { CustomerAuth } from '../../../common/auth/customer-auth.factory';
import { PRISMA_ERROR_CODES } from '../../../common/constants/prisma-error-codes.constants';
import { MediaService } from '../../../common/media/media.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CustomerModel } from '../../../generated/prisma/models';
import {
  CUSTOMER_DEFAULT_BAN_REASON,
  CUSTOMER_LIST_DEFAULT_PAGE,
  CUSTOMER_LIST_DEFAULT_PAGE_SIZE,
  PFP_STORAGE_KEY_PREFIX,
} from '../customers.constants';
import type { BanCustomerDto } from '../dto/ban-customer.dto';
import type { CreateCustomerDto } from '../dto/create-customer.dto';
import type { ListCustomersQueryDto } from '../dto/list-customers-query.dto';
import type { SetCustomerPasswordDto } from '../dto/set-customer-password.dto';
import type { UpdateCustomerDto } from '../dto/update-customer.dto';

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
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
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
    @Inject(CUSTOMER_AUTH) private readonly customerAuth: CustomerAuth,
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
      customers: customers.map((customer) => this.toListItem(customer)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Creates a customer account via better-auth's own sign-up flow (so
   * validation/uniqueness/hashing stay identical to self-service sign-up),
   * then deletes the session row signUpEmail auto-creates — it's never
   * handed to any browser here, so leaving it around would be an orphaned,
   * indefinitely-valid session.
   */
  async create(dto: CreateCustomerDto): Promise<CustomerListItem> {
    const result = await this.customerAuth.api.signUpEmail({
      body: { name: dto.name, email: dto.email, password: dto.password },
    });
    await this.prisma.customerSession.deleteMany({
      where: { userId: result.user.id },
    });

    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { accountId: result.user.id },
    });
    return this.getSummaryById(customer.id);
  }

  async updateForEmployee(
    customerId: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerListItem> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });

    try {
      await this.prisma.customerAccount.update({
        where: { id: customer.accountId },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.email !== undefined && { email: dto.email }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException('Email is already in use');
      }
      throw error;
    }

    return this.getSummaryById(customerId);
  }

  /**
   * Sets a customer's password directly, bypassing better-auth's admin
   * plugin (which isn't attached to the customer-auth instance — see
   * customer-auth.factory.ts). Mirrors the exact hashing/account-linking
   * logic better-auth's own admin plugin uses for setUserPassword
   * (node_modules/better-auth/dist/plugins/admin/routes.mjs): hash via the
   * same `hashPassword` function emailAndPassword defaults to, then
   * update-or-create the CustomerCredential row. If customer-auth.factory.ts
   * ever overrides emailAndPassword.password.hash, this would need updating
   * to match.
   */
  async setPasswordForEmployee(
    customerId: string,
    dto: SetCustomerPasswordDto,
  ): Promise<CustomerListItem> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });
    const hashed = await hashPassword(dto.newPassword);

    const existingCredential = await this.prisma.customerCredential.findFirst({
      where: {
        userId: customer.accountId,
        providerId: CREDENTIAL_PROVIDER_ID,
      },
    });

    if (existingCredential) {
      await this.prisma.customerCredential.update({
        where: { id: existingCredential.id },
        data: { password: hashed },
      });
    } else {
      await this.prisma.customerCredential.create({
        data: {
          userId: customer.accountId,
          accountId: customer.accountId,
          providerId: CREDENTIAL_PROVIDER_ID,
          password: hashed,
        },
      });
    }

    return this.getSummaryById(customerId);
  }

  async ban(
    customerId: string,
    dto: BanCustomerDto,
  ): Promise<CustomerListItem> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });

    await this.prisma.customerAccount.update({
      where: { id: customer.accountId },
      data: {
        banned: true,
        banReason: dto.banReason ?? CUSTOMER_DEFAULT_BAN_REASON,
        banExpires: null,
      },
    });
    await this.prisma.customerSession.deleteMany({
      where: { userId: customer.accountId },
    });

    return this.getSummaryById(customerId);
  }

  async unban(customerId: string): Promise<CustomerListItem> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });

    await this.prisma.customerAccount.update({
      where: { id: customer.accountId },
      data: { banned: false, banReason: null, banExpires: null },
    });

    return this.getSummaryById(customerId);
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

  private async getSummaryById(customerId: string): Promise<CustomerListItem> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      include: { account: true, pfpMedia: true },
    });
    return this.toListItem(customer);
  }

  private toListItem(
    customer: CustomerModel & {
      account: {
        name: string;
        email: string;
        banned: boolean | null;
        banReason: string | null;
        banExpires: Date | null;
      };
      pfpMedia: Parameters<MediaService['getPublicUrl']>[0] | null;
    },
  ): CustomerListItem {
    return {
      id: customer.id,
      name: customer.account.name,
      email: customer.account.email,
      pfpUrl: customer.pfpMedia
        ? this.mediaService.getPublicUrl(customer.pfpMedia)
        : null,
      banned: customer.account.banned,
      banReason: customer.account.banReason,
      banExpires: customer.account.banExpires,
    };
  }
}
