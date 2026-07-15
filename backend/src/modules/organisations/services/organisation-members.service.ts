import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  OrganisationMemberRole,
  OrganisationMemberStatus,
} from '../../../generated/prisma/client';
import type { OrganisationMemberModel } from '../../../generated/prisma/models';
import type { AddOrganisationMemberAsEmployeeDto } from '../dto/add-organisation-member-as-employee.dto';
import type { UpdateMemberDto } from '../dto/update-member.dto';
import { ORGANISATION_MAX_MEMBERS } from '../organisations.constants';
import { OrganisationsService } from './organisations.service';

export interface OrganisationMemberLinkedEcard {
  id: string;
  endpoint: string;
  heroName: string;
}

export interface OrganisationMemberListItem {
  id: string;
  customerId: string;
  name: string;
  email: string;
  role: OrganisationMemberRole;
  status: OrganisationMemberStatus;
  joinedAt: Date;
  linkedEcard: OrganisationMemberLinkedEcard | null;
}

@Injectable()
export class OrganisationMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  async list(
    customerId: string,
    organisationId: string,
  ): Promise<OrganisationMemberListItem[]> {
    await this.organisationsService.assertIsMember(customerId, organisationId);
    return this.listByOrganisationId(organisationId);
  }

  async listByOrganisationId(
    organisationId: string,
  ): Promise<OrganisationMemberListItem[]> {
    const members = await this.prisma.organisationMember.findMany({
      where: { organisationId },
      include: {
        customer: {
          include: {
            account: true,
            // At most one row per customer per organisationId (unique
            // constraint on ECard), so [0] below is safe.
            ecards: {
              where: { organisationId },
              select: { id: true, endpoint: true, heroName: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((member) => ({
      id: member.id,
      customerId: member.customerId,
      name: member.customer.account.name,
      email: member.customer.account.email,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      linkedEcard: member.customer.ecards[0] ?? null,
    }));
  }

  async update(
    customerId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<OrganisationMemberModel> {
    const member = await this.getMemberOrThrow(memberId);
    await this.organisationsService.assertIsSpoc(
      customerId,
      member.organisationId,
    );

    if (
      dto.role !== undefined &&
      member.role === OrganisationMemberRole.SPOC &&
      dto.role !== OrganisationMemberRole.SPOC
    ) {
      await this.assertNotLastSpoc(member.organisationId, memberId);
    }

    return this.prisma.organisationMember.update({
      where: { id: memberId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async remove(customerId: string, memberId: string): Promise<void> {
    const member = await this.getMemberOrThrow(memberId);
    await this.organisationsService.assertIsSpoc(
      customerId,
      member.organisationId,
    );

    if (member.role === OrganisationMemberRole.SPOC) {
      await this.assertNotLastSpoc(member.organisationId, memberId);
    }

    await this.prisma.organisationMember.delete({ where: { id: memberId } });
  }

  async removeForEmployee(memberId: string): Promise<void> {
    const member = await this.getMemberOrThrow(memberId);

    if (member.role === OrganisationMemberRole.SPOC) {
      await this.assertNotLastSpoc(member.organisationId, memberId);
    }

    await this.prisma.organisationMember.delete({ where: { id: memberId } });
  }

  /**
   * Bulk-adds one or more existing customers to an organisation in a single
   * atomic operation — either every customerId is added, or (on any
   * validation failure) none are, so the caller never has to reconcile a
   * partially-applied batch.
   */
  async addMembersForEmployee(
    organisationId: string,
    dto: AddOrganisationMemberAsEmployeeDto,
  ): Promise<OrganisationMemberModel[]> {
    await this.organisationsService.getByIdForEmployee(organisationId);

    const uniqueCustomerIds = [...new Set(dto.customerIds)];

    const existingCustomerCount = await this.prisma.customer.count({
      where: { id: { in: uniqueCustomerIds } },
    });
    if (existingCustomerCount !== uniqueCustomerIds.length) {
      throw new BadRequestException(
        'One or more customerIds do not reference an existing customer',
      );
    }

    const alreadyMembers = await this.prisma.organisationMember.findMany({
      where: { organisationId, customerId: { in: uniqueCustomerIds } },
      select: { customerId: true },
    });
    if (alreadyMembers.length > 0) {
      throw new ConflictException(
        'One or more selected customers already belong to this organisation',
      );
    }

    const currentMemberCount = await this.prisma.organisationMember.count({
      where: { organisationId },
    });
    if (
      currentMemberCount + uniqueCustomerIds.length >
      ORGANISATION_MAX_MEMBERS
    ) {
      throw new ConflictException(
        `Adding these members would exceed the organisation's limit of ${ORGANISATION_MAX_MEMBERS} members`,
      );
    }

    await this.prisma.organisationMember.createMany({
      data: uniqueCustomerIds.map((customerId) => ({
        organisationId,
        customerId,
        role: dto.role,
      })),
    });

    return this.prisma.organisationMember.findMany({
      where: { organisationId, customerId: { in: uniqueCustomerIds } },
    });
  }

  async updateForEmployee(
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<OrganisationMemberModel> {
    const member = await this.getMemberOrThrow(memberId);

    if (
      dto.role !== undefined &&
      member.role === OrganisationMemberRole.SPOC &&
      dto.role !== OrganisationMemberRole.SPOC
    ) {
      await this.assertNotLastSpoc(member.organisationId, memberId);
    }

    return this.prisma.organisationMember.update({
      where: { id: memberId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async getMemberInOrganisationOrThrow(
    memberId: string,
    organisationId: string,
  ): Promise<OrganisationMemberModel> {
    const member = await this.getMemberOrThrow(memberId);
    if (member.organisationId !== organisationId) {
      // Same message as the plain not-found case above — doesn't leak that
      // the member exists in a *different* organisation.
      throw new NotFoundException('Organisation member not found');
    }
    return member;
  }

  private async getMemberOrThrow(
    memberId: string,
  ): Promise<OrganisationMemberModel> {
    const member = await this.prisma.organisationMember.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException('Organisation member not found');
    }
    return member;
  }

  private async assertNotLastSpoc(
    organisationId: string,
    excludingMemberId: string,
  ): Promise<void> {
    const remainingSpocCount = await this.prisma.organisationMember.count({
      where: {
        organisationId,
        role: OrganisationMemberRole.SPOC,
        id: { not: excludingMemberId },
      },
    });
    if (remainingSpocCount === 0) {
      throw new ForbiddenException(
        'Cannot remove or demote the last SPOC of an organisation',
      );
    }
  }
}
