import { randomBytes } from 'crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { MailerService } from '../../../common/mailer/mailer.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  OrganisationInviteStatus,
  OrganisationMemberRole,
} from '../../../generated/prisma/client';
import type { OrganisationInviteModel } from '../../../generated/prisma/models';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { CustomersService } from '../../customers/services/customers.service';
import type { CreateCustomerDto } from '../../customers/dto/create-customer.dto';
import type { InviteMemberDto } from '../dto/invite-member.dto';
import {
  ORGANISATION_INVITE_EMAIL_SUBJECT,
  ORGANISATION_INVITE_EXPIRY_HOURS,
  ORGANISATION_INVITE_TOKEN_BYTES,
  ORGANISATION_MAX_MEMBERS,
} from '../organisations.constants';
import { OrganisationMembersService } from './organisation-members.service';
import { OrganisationsService } from './organisations.service';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export interface OrganisationInvitePublicLookup {
  organisationName: string;
  email: string;
  role: OrganisationMemberRole;
  // Effective status — a still-PENDING-in-the-DB row past its expiresAt is
  // reported as EXPIRED here without writing the lazy-expiry update that
  // only `accept()` performs; this is a read-only lookup.
  status: OrganisationInviteStatus;
  expiresAt: Date;
  emailFlowEnabled: boolean;
}

export interface OrganisationInviteAdminItem {
  id: string;
  email: string;
  role: OrganisationMemberRole;
  status: OrganisationInviteStatus;
  invitedByName: string;
  acceptedByCustomerName: string | null;
  resolvedByEmployeeName: string | null;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class OrganisationInvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly organisationMembersService: OrganisationMembersService,
    private readonly customersService: CustomersService,
    private readonly mailer: MailerService,
    private readonly appConfig: AppConfigService,
    private readonly planEnforcementService: PlanEnforcementService,
  ) {}

  async invite(
    customerId: string,
    organisationId: string,
    dto: InviteMemberDto,
  ): Promise<OrganisationInviteModel> {
    await this.organisationsService.assertIsSpoc(customerId, organisationId);
    const organisation = await this.prisma.organisation.findUniqueOrThrow({
      where: { id: organisationId },
    });

    const memberCount = await this.prisma.organisationMember.count({
      where: { organisationId: organisation.id },
    });
    if (memberCount >= ORGANISATION_MAX_MEMBERS) {
      throw new ConflictException('Organisation has reached its member limit');
    }

    const alreadyMember = await this.prisma.organisationMember.findFirst({
      where: {
        organisationId: organisation.id,
        customer: {
          account: { email: { equals: dto.email, mode: 'insensitive' } },
        },
      },
    });
    if (alreadyMember) {
      throw new ConflictException(
        'This person is already a member of the organisation',
      );
    }

    const token = randomBytes(ORGANISATION_INVITE_TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(
      Date.now() + ORGANISATION_INVITE_EXPIRY_HOURS * MILLISECONDS_PER_HOUR,
    );

    const invite = await this.prisma.organisationInvite.create({
      data: {
        organisationId: organisation.id,
        email: dto.email,
        role: dto.role,
        token,
        invitedByCustomerId: customerId,
        expiresAt,
      },
    });

    // The invite row is always created (it's what feeds the admin's manual
    // resolution queue) — only the outbound email is gated behind the
    // self-serve flow toggle, since a disabled toggle means the token-based
    // accept link wouldn't work anyway even if the email arrived.
    if (this.appConfig.organisationEmailInvitesEnabled) {
      await this.mailer.sendMail({
        to: dto.email,
        subject: ORGANISATION_INVITE_EMAIL_SUBJECT,
        text: `You've been invited to join "${organisation.name}". Accept your invite: ${this.appConfig.publicAppBaseUrl}/invite/${token}`,
      });
    }

    return invite;
  }

  async list(
    customerId: string,
    organisationId: string,
  ): Promise<OrganisationInviteModel[]> {
    await this.organisationsService.assertIsSpoc(customerId, organisationId);

    return this.prisma.organisationInvite.findMany({
      where: {
        organisationId,
        status: OrganisationInviteStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(customerId: string, inviteId: string): Promise<void> {
    const invite = await this.prisma.organisationInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    await this.organisationsService.assertIsSpoc(
      customerId,
      invite.organisationId,
    );

    await this.prisma.organisationInvite.update({
      where: { id: inviteId },
      data: { status: OrganisationInviteStatus.REVOKED },
    });
  }

  async lookupPublic(token: string): Promise<OrganisationInvitePublicLookup> {
    const invite = await this.prisma.organisationInvite.findUnique({
      where: { token },
      include: { organisation: { select: { name: true } } },
    });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    const isExpired =
      invite.status === OrganisationInviteStatus.PENDING &&
      invite.expiresAt.getTime() < Date.now();

    return {
      organisationName: invite.organisation.name,
      email: invite.email,
      role: invite.role,
      status: isExpired ? OrganisationInviteStatus.EXPIRED : invite.status,
      expiresAt: invite.expiresAt,
      emailFlowEnabled: this.appConfig.organisationEmailInvitesEnabled,
    };
  }

  async accept(
    customerId: string,
    customerEmail: string,
    token: string,
  ): Promise<OrganisationInviteModel> {
    if (!this.appConfig.organisationEmailInvitesEnabled) {
      throw new ForbiddenException(
        'Self-serve invite acceptance is currently disabled',
      );
    }

    const invite = await this.prisma.organisationInvite.findUnique({
      where: { token },
    });
    if (!invite || invite.status !== OrganisationInviteStatus.PENDING) {
      throw new NotFoundException('Invite not found or no longer valid');
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      await this.prisma.organisationInvite.update({
        where: { id: invite.id },
        data: { status: OrganisationInviteStatus.EXPIRED },
      });
      throw new ForbiddenException('This invite has expired');
    }

    if (invite.email.toLowerCase() !== customerEmail.toLowerCase()) {
      throw new ForbiddenException(
        'This invite was sent to a different email address',
      );
    }

    const existingMembership = await this.prisma.organisationMember.findUnique({
      where: {
        customerId_organisationId: {
          customerId,
          organisationId: invite.organisationId,
        },
      },
    });
    if (existingMembership) {
      throw new ConflictException(
        'Customer already belongs to this organisation',
      );
    }

    await this.planEnforcementService.assertCanJoinOrganisation(customerId);

    await this.prisma.$transaction([
      this.prisma.organisationMember.create({
        data: {
          organisationId: invite.organisationId,
          customerId,
          role: invite.role,
        },
      }),
      this.prisma.organisationInvite.update({
        where: { id: invite.id },
        data: {
          status: OrganisationInviteStatus.ACCEPTED,
          acceptedByCustomerId: customerId,
        },
      }),
    ]);

    return this.prisma.organisationInvite.findUniqueOrThrow({
      where: { id: invite.id },
    });
  }

  // ── Employee (admin manual resolution) ──────────────────────────────────

  async listForEmployee(
    organisationId: string,
  ): Promise<OrganisationInviteAdminItem[]> {
    await this.organisationsService.getByIdForEmployee(organisationId);

    const invites = await this.prisma.organisationInvite.findMany({
      where: { organisationId },
      include: {
        invitedByCustomer: { include: { account: true } },
        acceptedByCustomer: { include: { account: true } },
        resolvedByEmployee: { include: { account: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      invitedByName: invite.invitedByCustomer.account.name,
      acceptedByCustomerName: invite.acceptedByCustomer?.account.name ?? null,
      resolvedByEmployeeName: invite.resolvedByEmployee?.account.name ?? null,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    }));
  }

  async linkExistingCustomerForEmployee(
    actorAccountId: string,
    organisationId: string,
    inviteId: string,
    customerId: string,
  ): Promise<void> {
    const employee = await this.getEmployeeByAccountIdOrThrow(actorAccountId);
    const invite = await this.getPendingInviteForOrgOrThrow(
      organisationId,
      inviteId,
    );

    // Reuses the exact same bulk-add validation (existence, already-member,
    // member cap, plan enforcement) the admin's regular "Add member" flow
    // already goes through — no need to duplicate those checks here.
    await this.organisationMembersService.addMembersForEmployee(
      organisationId,
      { customerIds: [customerId], role: invite.role },
    );

    await this.resolveInvite(invite.id, customerId, employee.id);
  }

  async createAndLinkCustomerForEmployee(
    actorAccountId: string,
    organisationId: string,
    inviteId: string,
    dto: CreateCustomerDto,
  ): Promise<void> {
    const employee = await this.getEmployeeByAccountIdOrThrow(actorAccountId);
    const invite = await this.getPendingInviteForOrgOrThrow(
      organisationId,
      inviteId,
    );

    const customer = await this.customersService.create(dto);
    await this.organisationMembersService.addMembersForEmployee(
      organisationId,
      { customerIds: [customer.id], role: invite.role },
    );

    await this.resolveInvite(invite.id, customer.id, employee.id);
  }

  async revokeForEmployee(
    actorAccountId: string,
    organisationId: string,
    inviteId: string,
  ): Promise<void> {
    const employee = await this.getEmployeeByAccountIdOrThrow(actorAccountId);
    const invite = await this.getPendingInviteForOrgOrThrow(
      organisationId,
      inviteId,
    );

    await this.prisma.organisationInvite.update({
      where: { id: invite.id },
      data: {
        status: OrganisationInviteStatus.REVOKED,
        resolvedByEmployeeId: employee.id,
      },
    });
  }

  private async getPendingInviteForOrgOrThrow(
    organisationId: string,
    inviteId: string,
  ): Promise<OrganisationInviteModel> {
    await this.organisationsService.getByIdForEmployee(organisationId);

    const invite = await this.prisma.organisationInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite || invite.organisationId !== organisationId) {
      throw new NotFoundException('Invite not found');
    }
    if (invite.status !== OrganisationInviteStatus.PENDING) {
      throw new ConflictException('This invite has already been resolved');
    }
    return invite;
  }

  private async resolveInvite(
    inviteId: string,
    acceptedByCustomerId: string,
    resolvedByEmployeeId: string,
  ): Promise<void> {
    await this.prisma.organisationInvite.update({
      where: { id: inviteId },
      data: {
        status: OrganisationInviteStatus.RESOLVED,
        acceptedByCustomerId,
        resolvedByEmployeeId,
      },
    });
  }

  // Same pattern as PlanAssignmentsService.getEmployeeByAccountIdOrThrow /
  // EventsService's equivalent — no shared EmployeesService exists yet.
  private async getEmployeeByAccountIdOrThrow(
    accountId: string,
  ): Promise<{ id: string }> {
    return this.prisma.employee.findUniqueOrThrow({
      where: { accountId },
      select: { id: true },
    });
  }
}
