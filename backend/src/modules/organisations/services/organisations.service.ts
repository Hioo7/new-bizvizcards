import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class OrganisationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    customerId: string,
    dto: CreateOrganisationDto,
  ): Promise<OrganisationWithMembership> {
    const existingMembership = await this.prisma.organisationMember.findUnique({
      where: { customerId },
    });
    if (existingMembership) {
      throw new ConflictException(
        'Customer already belongs to an organisation',
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
      where: { customerId },
    });

    return { organisation, membership };
  }

  async getMine(
    customerId: string,
  ): Promise<OrganisationWithMembership | null> {
    const membership = await this.prisma.organisationMember.findUnique({
      where: { customerId },
    });
    if (!membership) {
      return null;
    }

    const organisation = await this.prisma.organisation.findUniqueOrThrow({
      where: { id: membership.organisationId },
    });

    return { organisation, membership };
  }

  async getMembershipOrThrow(
    customerId: string,
  ): Promise<OrganisationWithMembership> {
    const result = await this.getMine(customerId);
    if (!result) {
      throw new NotFoundException(
        'Customer does not belong to an organisation',
      );
    }
    return result;
  }

  async update(
    customerId: string,
    dto: UpdateOrganisationDto,
  ): Promise<OrganisationModel> {
    const { organisation } = await this.getMembershipOrThrow(customerId);
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
      where: { customerId },
    });
    if (
      !membership ||
      membership.organisationId !== organisationId ||
      membership.role !== OrganisationMemberRole.SPOC
    ) {
      throw new ForbiddenException(
        'Only the organisation SPOC can perform this action',
      );
    }
    return membership;
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
