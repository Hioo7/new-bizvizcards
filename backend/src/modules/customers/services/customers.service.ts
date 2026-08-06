import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  CREDENTIAL_PROVIDER_ID,
  CUSTOMER_AUTH,
} from '../../../common/auth/auth.constants';
import { hashCustomerPassword } from '../../../common/auth/customer-password-hasher';
import type { CustomerAuth } from '../../../common/auth/customer-auth.factory';
import { PRISMA_ERROR_CODES } from '../../../common/constants/prisma-error-codes.constants';
import { MediaService } from '../../../common/media/media.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ECardEventType, Prisma } from '../../../generated/prisma/client';
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
import type { UpdateCustomerPhoneDto } from '../dto/update-customer-phone.dto';

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

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  pfpUrl: string | null;
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
}

export interface CustomerListItem {
  id: string;
  name: string;
  email: string;
  pfpUrl: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  currentPlan: { id: string; name: string } | null;
  totalViews: number;
  totalLeads: number;
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

  async getMe(accountId: string): Promise<CustomerProfile> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { accountId },
      include: { account: true, pfpMedia: true },
    });
    return {
      id: customer.id,
      name: customer.account.name,
      email: customer.account.email,
      pfpUrl: customer.pfpMedia
        ? this.mediaService.getPublicUrl(customer.pfpMedia)
        : null,
      phoneCountryDialCode: customer.phoneCountryDialCode,
      phoneNumber: customer.phoneNumber,
    };
  }

  async updatePhone(
    accountId: string,
    dto: UpdateCustomerPhoneDto,
  ): Promise<CustomerProfile> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { accountId },
    });

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        phoneCountryDialCode:
          dto.phoneCountryDialCode !== undefined
            ? dto.phoneCountryDialCode
            : undefined,
        phoneNumber:
          dto.phoneNumber !== undefined ? dto.phoneNumber : undefined,
      },
    });

    return this.getMe(accountId);
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
        include: {
          account: true,
          pfpMedia: true,
          currentPlan: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);

    const customerIds = customers.map((customer) => customer.id);
    const [leadCounts, viewCounts] = await Promise.all([
      this.getLeadCountsByCustomerId(customerIds),
      this.getViewCountsByCustomerId(customerIds),
    ]);

    return {
      customers: customers.map((customer) =>
        this.toListItem(customer, {
          totalLeads: leadCounts.get(customer.id) ?? 0,
          totalViews: viewCounts.get(customer.id) ?? 0,
        }),
      ),
      total,
      page,
      pageSize,
    };
  }

  private async getLeadCountsByCustomerId(
    customerIds: string[],
  ): Promise<Map<string, number>> {
    if (customerIds.length === 0) return new Map();

    const grouped = await this.prisma.lead.groupBy({
      by: ['customerId'],
      where: { customerId: { in: customerIds } },
      _count: { _all: true },
    });

    return new Map(grouped.map((g) => [g.customerId, g._count._all]));
  }

  private async getViewCountsByCustomerId(
    customerIds: string[],
  ): Promise<Map<string, number>> {
    if (customerIds.length === 0) return new Map();

    const ecards = await this.prisma.eCard.findMany({
      where: { customerId: { in: customerIds } },
      select: { id: true, customerId: true },
    });
    if (ecards.length === 0) return new Map();

    const customerIdByEcardId = new Map(
      ecards.map((ecard) => [ecard.id, ecard.customerId]),
    );

    const grouped = await this.prisma.eCardEvent.groupBy({
      by: ['ecardId'],
      where: {
        ecardId: { in: ecards.map((ecard) => ecard.id) },
        type: ECardEventType.VIEW,
      },
      _count: { _all: true },
    });

    const viewCounts = new Map<string, number>();
    for (const group of grouped) {
      const customerId = customerIdByEcardId.get(group.ecardId);
      if (!customerId) continue;
      viewCounts.set(
        customerId,
        (viewCounts.get(customerId) ?? 0) + group._count._all,
      );
    }
    return viewCounts;
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
   * (node_modules/better-auth/dist/plugins/admin/routes.mjs), but hashes via
   * hashCustomerPassword — the same bcrypt function
   * customer-auth.factory.ts's emailAndPassword.password.hash is overridden
   * to (see that file and customer-password-hasher.ts for why: it lets the
   * legacy-data migration carry over legacy bcrypt hashes directly). Keep
   * both in sync if the hashing strategy ever changes again.
   */
  async setPasswordForEmployee(
    customerId: string,
    dto: SetCustomerPasswordDto,
  ): Promise<CustomerListItem> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });
    const hashed = await hashCustomerPassword(dto.newPassword);

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

  async lookupByEmail(
    email: string,
  ): Promise<{ id: string; name: string; email: string } | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { account: { email: { equals: email, mode: 'insensitive' } } },
      include: { account: true },
    });
    if (!customer) return null;
    return {
      id: customer.id,
      name: customer.account.name,
      email: customer.account.email,
    };
  }

  private async getSummaryById(customerId: string): Promise<CustomerListItem> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      include: {
        account: true,
        pfpMedia: true,
        currentPlan: { select: { id: true, name: true } },
      },
    });
    const [leadCounts, viewCounts] = await Promise.all([
      this.getLeadCountsByCustomerId([customerId]),
      this.getViewCountsByCustomerId([customerId]),
    ]);
    return this.toListItem(customer, {
      totalLeads: leadCounts.get(customerId) ?? 0,
      totalViews: viewCounts.get(customerId) ?? 0,
    });
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
      currentPlan: { id: string; name: string } | null;
    },
    stats: { totalLeads: number; totalViews: number },
  ): CustomerListItem {
    return {
      id: customer.id,
      name: customer.account.name,
      email: customer.account.email,
      pfpUrl: customer.pfpMedia
        ? this.mediaService.getPublicUrl(customer.pfpMedia)
        : null,
      currentPlan: customer.currentPlan
        ? { id: customer.currentPlan.id, name: customer.currentPlan.name }
        : null,
      banned: customer.account.banned,
      banReason: customer.account.banReason,
      banExpires: customer.account.banExpires,
      totalLeads: stats.totalLeads,
      totalViews: stats.totalViews,
    };
  }
}
