import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaService } from '../../../common/media/media.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { OrganisationMemberRole } from '../../../generated/prisma/client';
import type {
  OrganisationMemberModel,
  OrganisationModel,
} from '../../../generated/prisma/models';
import type { CreateOrganisationDto } from '../dto/create-organisation.dto';
import type { ListOrganisationsQueryDto } from '../dto/list-organisations-query.dto';
import type { UpdateOrganisationDto } from '../dto/update-organisation.dto';
import {
  ORGANISATION_LIST_DEFAULT_PAGE,
  ORGANISATION_LIST_DEFAULT_PAGE_SIZE,
  ORGANISATION_LOGO_STORAGE_KEY_PREFIX,
  ORGANISATION_MAX_MEMBERSHIPS_PER_CUSTOMER,
} from '../organisations.constants';

export interface OrganisationLogoUpload {
  buffer: Buffer;
  contentType: string;
  originalName: string;
  extension: string;
}

export interface OrganisationLogoReplaceResult {
  organisation: OrganisationSummary;
  logoUrl: string;
}

export interface OrganisationWithMembership {
  organisation: OrganisationModel;
  membership: OrganisationMemberModel;
}

// Employee-facing read shape — resolves logoMediaId into a public URL
// (mirroring CustomerListItem.pfpUrl) so the admin org list/detail views
// don't need a separate media lookup.
export interface OrganisationSummary {
  id: string;
  name: string;
  logoMediaId: string | null;
  logoUrl: string | null;
  createdByCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganisationListResult {
  organisations: OrganisationSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomerMembershipWithOrgDetails {
  organisationId: string;
  organisationName: string;
  organisationLogoUrl: string | null;
  role: OrganisationMemberRole;
  spocEmail: string | null;
}

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async create(
    customerId: string,
    dto: CreateOrganisationDto,
  ): Promise<OrganisationWithMembership> {
    const membershipCount = await this.prisma.organisationMember.count({
      where: { customerId },
    });
    if (membershipCount >= ORGANISATION_MAX_MEMBERSHIPS_PER_CUSTOMER) {
      throw new ConflictException(
        `This customer already belongs to the maximum of ${ORGANISATION_MAX_MEMBERSHIPS_PER_CUSTOMER} organisations`,
      );
    }

    const organisation = await this.prisma.organisation.create({
      data: {
        name: dto.name,
        createdByCustomerId: customerId,
        members: {
          create: {
            customerId,
            role: OrganisationMemberRole.SPOC,
          },
        },
      },
    });

    const membership = await this.prisma.organisationMember.findUniqueOrThrow({
      where: {
        customerId_organisationId: {
          customerId,
          organisationId: organisation.id,
        },
      },
    });

    return { organisation, membership };
  }

  async listMine(customerId: string): Promise<OrganisationWithMembership[]> {
    const memberships = await this.prisma.organisationMember.findMany({
      where: { customerId },
      include: { organisation: true },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((membership) => ({
      organisation: membership.organisation,
      membership,
    }));
  }

  async listMembershipsWithOrgDetails(
    customerId: string,
  ): Promise<CustomerMembershipWithOrgDetails[]> {
    const memberships = await this.prisma.organisationMember.findMany({
      where: { customerId },
      include: { organisation: { include: { logo: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    if (memberships.length === 0) {
      return [];
    }

    const organisationIds = memberships.map((m) => m.organisationId);
    const spocs = await this.prisma.organisationMember.findMany({
      where: {
        organisationId: { in: organisationIds },
        role: OrganisationMemberRole.SPOC,
      },
      include: { customer: { include: { account: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    const spocEmailByOrganisationId = new Map<string, string>();
    for (const spoc of spocs) {
      if (!spocEmailByOrganisationId.has(spoc.organisationId)) {
        spocEmailByOrganisationId.set(
          spoc.organisationId,
          spoc.customer.account.email,
        );
      }
    }

    return memberships.map((membership) => ({
      organisationId: membership.organisationId,
      organisationName: membership.organisation.name,
      organisationLogoUrl: membership.organisation.logo
        ? this.mediaService.getPublicUrl(membership.organisation.logo)
        : null,
      role: membership.role,
      spocEmail:
        spocEmailByOrganisationId.get(membership.organisationId) ?? null,
    }));
  }

  async getMembershipOrThrow(
    customerId: string,
    organisationId: string,
  ): Promise<OrganisationWithMembership> {
    const membership = await this.prisma.organisationMember.findUnique({
      where: { customerId_organisationId: { customerId, organisationId } },
    });
    if (!membership) {
      throw new NotFoundException(
        'Customer does not belong to this organisation',
      );
    }
    const organisation = await this.prisma.organisation.findUniqueOrThrow({
      where: { id: membership.organisationId },
    });
    return { organisation, membership };
  }

  async update(
    customerId: string,
    organisationId: string,
    dto: UpdateOrganisationDto,
  ): Promise<OrganisationModel> {
    const { organisation } = await this.getMembershipOrThrow(
      customerId,
      organisationId,
    );
    await this.assertIsSpoc(customerId, organisation.id);

    return this.prisma.organisation.update({
      where: { id: organisation.id },
      data: { name: dto.name },
    });
  }

  async assertIsSpoc(
    customerId: string,
    organisationId: string,
  ): Promise<OrganisationMemberModel> {
    const membership = await this.prisma.organisationMember.findUnique({
      where: { customerId_organisationId: { customerId, organisationId } },
    });
    if (!membership || membership.role !== OrganisationMemberRole.SPOC) {
      throw new ForbiddenException(
        'Only the organisation SPOC can perform this action',
      );
    }
    return membership;
  }

  async assertIsMember(
    customerId: string,
    organisationId: string,
  ): Promise<void> {
    const membership = await this.prisma.organisationMember.findUnique({
      where: { customerId_organisationId: { customerId, organisationId } },
    });
    if (!membership) {
      throw new ForbiddenException(
        'Customer does not belong to this organisation',
      );
    }
  }

  async listAllForEmployee(
    query: ListOrganisationsQueryDto,
  ): Promise<OrganisationListResult> {
    const page = query.page ?? ORGANISATION_LIST_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? ORGANISATION_LIST_DEFAULT_PAGE_SIZE;

    const where = {
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' as const },
      }),
    };

    const [organisations, total] = await Promise.all([
      this.prisma.organisation.findMany({
        where,
        include: { logo: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.organisation.count({ where }),
    ]);

    return {
      organisations: organisations.map((o) => this.toSummary(o)),
      total,
      page,
      pageSize,
    };
  }

  async getByIdForEmployee(id: string): Promise<OrganisationSummary> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
      include: { logo: true },
    });
    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }
    return this.toSummary(organisation);
  }

  async updateForEmployee(
    id: string,
    dto: UpdateOrganisationDto,
  ): Promise<OrganisationSummary> {
    await this.getByIdForEmployee(id);

    await this.prisma.organisation.update({
      where: { id },
      data: { name: dto.name },
    });
    return this.getByIdForEmployee(id);
  }

  async replaceLogo(
    organisationId: string,
    upload: OrganisationLogoUpload,
  ): Promise<OrganisationLogoReplaceResult> {
    const existing = await this.getByIdForEmployee(organisationId);

    const newMedia = await this.mediaService.upload({
      ...upload,
      keyPrefix: `${ORGANISATION_LOGO_STORAGE_KEY_PREFIX}/${organisationId}`,
    });
    const logoUrl = this.mediaService.getPublicUrl(newMedia);

    await this.prisma.organisation.update({
      where: { id: organisationId },
      data: { logoMediaId: newMedia.id },
    });

    if (existing.logoMediaId) {
      await this.mediaService.delete(existing.logoMediaId);
    }

    return {
      organisation: await this.getByIdForEmployee(organisationId),
      logoUrl,
    };
  }

  async removeLogo(organisationId: string): Promise<OrganisationSummary> {
    const existing = await this.getByIdForEmployee(organisationId);

    if (!existing.logoMediaId) {
      return existing;
    }

    await this.prisma.organisation.update({
      where: { id: organisationId },
      data: { logoMediaId: null },
    });

    await this.mediaService.delete(existing.logoMediaId);

    return this.getByIdForEmployee(organisationId);
  }

  async removeForEmployee(id: string): Promise<void> {
    await this.getByIdForEmployee(id);
    await this.prisma.organisation.delete({ where: { id } });
  }

  private toSummary(
    organisation: OrganisationModel & {
      logo: Parameters<MediaService['getPublicUrl']>[0] | null;
    },
  ): OrganisationSummary {
    return {
      id: organisation.id,
      name: organisation.name,
      logoMediaId: organisation.logoMediaId,
      logoUrl: organisation.logo
        ? this.mediaService.getPublicUrl(organisation.logo)
        : null,
      createdByCustomerId: organisation.createdByCustomerId,
      createdAt: organisation.createdAt,
      updatedAt: organisation.updatedAt,
    };
  }
}
