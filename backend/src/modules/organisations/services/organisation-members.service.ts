import {
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
import type { UpdateMemberDto } from '../dto/update-member.dto';
import { OrganisationsService } from './organisations.service';

export interface OrganisationMemberListItem {
  id: string;
  customerId: string;
  name: string;
  email: string;
  role: OrganisationMemberRole;
  status: OrganisationMemberStatus;
  joinedAt: Date;
}

@Injectable()
export class OrganisationMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  async list(customerId: string): Promise<OrganisationMemberListItem[]> {
    const { organisation } =
      await this.organisationsService.getMembershipOrThrow(customerId);
    return this.listByOrganisationId(organisation.id);
  }

  async listByCustomerIdForEmployee(
    customerId: string,
  ): Promise<OrganisationMemberListItem[]> {
    const membership = await this.prisma.organisationMember.findUnique({
      where: { customerId },
    });
    if (!membership) {
      return [];
    }
    return this.listByOrganisationId(membership.organisationId);
  }

  async listByOrganisationId(
    organisationId: string,
  ): Promise<OrganisationMemberListItem[]> {
    const members = await this.prisma.organisationMember.findMany({
      where: { organisationId },
      include: { customer: { include: { account: true } } },
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
    }));
  }

  async update(
    customerId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<OrganisationMemberModel> {
    const { organisation } =
      await this.organisationsService.getMembershipOrThrow(customerId);
    await this.organisationsService.assertIsSpoc(customerId, organisation.id);

    const member = await this.getMemberInOrganisationOrThrow(
      organisation.id,
      memberId,
    );

    if (
      dto.role !== undefined &&
      member.role === OrganisationMemberRole.SPOC &&
      dto.role !== OrganisationMemberRole.SPOC
    ) {
      await this.assertNotLastSpoc(organisation.id, memberId);
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
    const { organisation } =
      await this.organisationsService.getMembershipOrThrow(customerId);
    await this.organisationsService.assertIsSpoc(customerId, organisation.id);

    const member = await this.getMemberInOrganisationOrThrow(
      organisation.id,
      memberId,
    );

    if (member.role === OrganisationMemberRole.SPOC) {
      await this.assertNotLastSpoc(organisation.id, memberId);
    }

    await this.prisma.organisationMember.delete({ where: { id: memberId } });
  }

  async removeForEmployee(memberId: string): Promise<void> {
    const member = await this.prisma.organisationMember.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException('Organisation member not found');
    }

    if (member.role === OrganisationMemberRole.SPOC) {
      await this.assertNotLastSpoc(member.organisationId, memberId);
    }

    await this.prisma.organisationMember.delete({ where: { id: memberId } });
  }

  private async getMemberInOrganisationOrThrow(
    organisationId: string,
    memberId: string,
  ): Promise<OrganisationMemberModel> {
    const member = await this.prisma.organisationMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.organisationId !== organisationId) {
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
