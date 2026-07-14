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
  ORGANISATION_MAX_MEMBERSHIPS_PER_CUSTOMER,
} from '../organisations.constants';

export interface OrganisationWithMembership {
  organisation: OrganisationModel;
  membership: OrganisationMemberModel;
}

export interface OrganisationListResult {
  organisations: OrganisationModel[];
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

    const [organisations, total] = await Promise.all([
      this.prisma.organisation.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.organisation.count(),
    ]);

    return { organisations, total, page, pageSize };
  }

  async getByIdForEmployee(id: string): Promise<OrganisationModel> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
    });
    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }
    return organisation;
  }

  async removeForEmployee(id: string): Promise<void> {
    await this.getByIdForEmployee(id);
    await this.prisma.organisation.delete({ where: { id } });
  }
}
