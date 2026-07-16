import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EventMemberRole } from '../../../generated/prisma/client';
import {
  EVENT_ONLY_HOST_CAN_EDIT_MESSAGE,
  EVENT_ONLY_HOST_COHOST_OR_EMPLOYEE_MESSAGE,
  EVENT_ONLY_HOST_COHOST_OR_VOLUNTEER_CAN_SCAN_MESSAGE,
  EVENT_ONLY_HOST_OR_EMPLOYEE_CAN_MANAGE_CO_HOSTS_MESSAGE,
} from '../business-events.constants';

/**
 * Centralizes the event permission matrix in one place instead of
 * duplicating it per controller — every customer-facing controller/service
 * in this module calls into here to check whether the acting customer's
 * EventMember role permits the action. Employee-facing endpoints never call
 * this: permission is already fully enforced by PermissionsGuard +
 * @RequirePermissions at the controller layer, the same pattern already
 * used for organisations' employee-facing paths.
 */
@Injectable()
export class EventAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Host or co-host — manages the guest list and trackables. */
  async assertCanManageGuests(
    customerId: string,
    eventId: string,
  ): Promise<void> {
    await this.assertRoleIn(
      customerId,
      eventId,
      [EventMemberRole.HOST, EventMemberRole.CO_HOST],
      EVENT_ONLY_HOST_COHOST_OR_EMPLOYEE_MESSAGE,
    );
  }

  /** Host or co-host — manages trackables. */
  async assertCanManageTrackables(
    customerId: string,
    eventId: string,
  ): Promise<void> {
    await this.assertRoleIn(
      customerId,
      eventId,
      [EventMemberRole.HOST, EventMemberRole.CO_HOST],
      EVENT_ONLY_HOST_COHOST_OR_EMPLOYEE_MESSAGE,
    );
  }

  /** Host only — co-hosts can never manage other co-hosts. */
  async assertCanManageCoHosts(
    customerId: string,
    eventId: string,
  ): Promise<void> {
    await this.assertRoleIn(
      customerId,
      eventId,
      [EventMemberRole.HOST],
      EVENT_ONLY_HOST_OR_EMPLOYEE_CAN_MANAGE_CO_HOSTS_MESSAGE,
    );
  }

  /** Host only — editing the event's own core details (name, dates, etc). */
  async assertCanEditEventDetails(
    customerId: string,
    eventId: string,
  ): Promise<void> {
    await this.assertRoleIn(
      customerId,
      eventId,
      [EventMemberRole.HOST],
      EVENT_ONLY_HOST_CAN_EDIT_MESSAGE,
    );
  }

  /** Host or co-host — either can add/remove volunteers. */
  async assertCanManageVolunteers(
    customerId: string,
    eventId: string,
  ): Promise<void> {
    await this.assertRoleIn(
      customerId,
      eventId,
      [EventMemberRole.HOST, EventMemberRole.CO_HOST],
      EVENT_ONLY_HOST_COHOST_OR_EMPLOYEE_MESSAGE,
    );
  }

  /** Host, co-host, or volunteer — any member can scan; employees never can. */
  async assertCanScan(customerId: string, eventId: string): Promise<void> {
    await this.assertRoleIn(
      customerId,
      eventId,
      [
        EventMemberRole.HOST,
        EventMemberRole.CO_HOST,
        EventMemberRole.VOLUNTEER,
      ],
      EVENT_ONLY_HOST_COHOST_OR_VOLUNTEER_CAN_SCAN_MESSAGE,
    );
  }

  private async assertRoleIn(
    customerId: string,
    eventId: string,
    allowedRoles: EventMemberRole[],
    message: string,
  ): Promise<void> {
    const membership = await this.prisma.eventMember.findUnique({
      where: { customerId_eventId: { customerId, eventId } },
      select: { role: true },
    });
    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(message);
    }
  }
}
