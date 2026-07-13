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
import { OrganisationInviteStatus } from '../../../generated/prisma/client';
import type { OrganisationInviteModel } from '../../../generated/prisma/models';
import type { InviteMemberDto } from '../dto/invite-member.dto';
import {
  ORGANISATION_INVITE_EMAIL_SUBJECT,
  ORGANISATION_INVITE_EXPIRY_HOURS,
  ORGANISATION_INVITE_TOKEN_BYTES,
  ORGANISATION_MAX_MEMBERS,
} from '../organisations.constants';
import { OrganisationsService } from './organisations.service';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

@Injectable()
export class OrganisationInvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly mailer: MailerService,
    private readonly appConfig: AppConfigService,
  ) {}

  async invite(
    customerId: string,
    dto: InviteMemberDto,
  ): Promise<OrganisationInviteModel> {
    const { organisation } =
      await this.organisationsService.getMembershipOrThrow(customerId);
    await this.organisationsService.assertIsSpoc(customerId, organisation.id);

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

    await this.mailer.sendMail({
      to: dto.email,
      subject: ORGANISATION_INVITE_EMAIL_SUBJECT,
      text: `You've been invited to join "${organisation.name}". Accept your invite: ${this.appConfig.publicAppBaseUrl}/invite/${token}`,
    });

    return invite;
  }

  async list(customerId: string): Promise<OrganisationInviteModel[]> {
    const { organisation } =
      await this.organisationsService.getMembershipOrThrow(customerId);
    await this.organisationsService.assertIsSpoc(customerId, organisation.id);

    return this.prisma.organisationInvite.findMany({
      where: {
        organisationId: organisation.id,
        status: OrganisationInviteStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(customerId: string, inviteId: string): Promise<void> {
    const { organisation } =
      await this.organisationsService.getMembershipOrThrow(customerId);
    await this.organisationsService.assertIsSpoc(customerId, organisation.id);

    const invite = await this.prisma.organisationInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite || invite.organisationId !== organisation.id) {
      throw new NotFoundException('Invite not found');
    }

    await this.prisma.organisationInvite.update({
      where: { id: inviteId },
      data: { status: OrganisationInviteStatus.REVOKED },
    });
  }

  async accept(
    customerId: string,
    customerEmail: string,
    token: string,
  ): Promise<OrganisationInviteModel> {
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
      where: { customerId },
    });
    if (existingMembership) {
      throw new ConflictException(
        'Customer already belongs to an organisation',
      );
    }

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
}
