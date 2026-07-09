import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EMPLOYEE_AUTH } from '../../../common/auth/auth.constants';
import type { EmployeeAuth } from '../../../common/auth/employee-auth.factory';
import {
  EMPLOYEE_ROLE,
  EmployeeRole,
} from '../../../common/constants/roles.constants';
import { EmployeeAccountModel } from '../../../generated/prisma/models';
import {
  STAFF_LIST_DEFAULT_PAGE,
  STAFF_LIST_DEFAULT_PAGE_SIZE,
} from '../staff.constants';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { SetStaffRoleDto } from '../dto/set-staff-role.dto';
import { BanStaffDto } from '../dto/ban-staff.dto';
import { ListStaffQueryDto } from '../dto/list-staff-query.dto';

export type StaffMember = Pick<
  EmployeeAccountModel,
  | 'id'
  | 'name'
  | 'email'
  | 'role'
  | 'banned'
  | 'banReason'
  | 'banExpires'
  | 'createdAt'
>;

export interface StaffListResult {
  staff: StaffMember[];
  total: number;
  page: number;
  pageSize: number;
}

const STAFF_MEMBER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  banned: true,
  banReason: true,
  banExpires: true,
  createdAt: true,
} as const;

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMPLOYEE_AUTH) private readonly employeeAuth: EmployeeAuth,
  ) {}

  async list(query: ListStaffQueryDto): Promise<StaffListResult> {
    const page = query.page ?? STAFF_LIST_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? STAFF_LIST_DEFAULT_PAGE_SIZE;

    const where = {
      ...(query.role && { role: query.role }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [staff, total] = await Promise.all([
      this.prisma.employeeAccount.findMany({
        where,
        select: STAFF_MEMBER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.employeeAccount.count({ where }),
    ]);

    return { staff, total, page, pageSize };
  }

  /**
   * Blocks any action against the super_admin account (nobody, including
   * itself, can be edited/banned/deleted/role-changed here) and, for an
   * admin actor, blocks anything but an employee-role target.
   */
  private async assertActionable(
    actorRole: EmployeeRole,
    targetId: string,
  ): Promise<StaffMember> {
    const target = await this.prisma.employeeAccount.findUniqueOrThrow({
      where: { id: targetId },
      select: STAFF_MEMBER_SELECT,
    });

    if (target.role === EMPLOYEE_ROLE.SUPER_ADMIN) {
      throw new ForbiddenException();
    }
    if (
      actorRole === EMPLOYEE_ROLE.ADMIN &&
      target.role !== EMPLOYEE_ROLE.EMPLOYEE
    ) {
      throw new ForbiddenException();
    }

    return target;
  }

  async create(
    actorRole: EmployeeRole,
    headers: Headers,
    dto: CreateStaffDto,
  ): Promise<StaffMember> {
    // An admin actor can never assign a role — omit it entirely so
    // better-auth falls back to its configured defaultRole (employee)
    // instead of tripping its own set-role permission check.
    const role = actorRole === EMPLOYEE_ROLE.ADMIN ? undefined : dto.role;

    const result = await this.employeeAuth.api.createUser({
      headers,
      body: { email: dto.email, name: dto.name, role },
    });

    return this.getById(result.user.id);
  }

  async updateName(
    actorRole: EmployeeRole,
    headers: Headers,
    targetId: string,
    dto: UpdateStaffDto,
  ): Promise<StaffMember> {
    await this.assertActionable(actorRole, targetId);

    await this.employeeAuth.api.adminUpdateUser({
      headers,
      body: { userId: targetId, data: { name: dto.name } },
    });

    return this.getById(targetId);
  }

  async setRole(
    actorId: string,
    actorRole: EmployeeRole,
    headers: Headers,
    targetId: string,
    dto: SetStaffRoleDto,
  ): Promise<StaffMember> {
    if (targetId === actorId) {
      // Defensive: better-auth has no built-in guard against a super_admin
      // demoting themselves, and there is only ever one super_admin.
      throw new ForbiddenException();
    }
    await this.assertActionable(actorRole, targetId);

    await this.employeeAuth.api.setRole({
      headers,
      body: { userId: targetId, role: dto.role },
    });

    return this.getById(targetId);
  }

  async ban(
    actorRole: EmployeeRole,
    headers: Headers,
    targetId: string,
    dto: BanStaffDto,
  ): Promise<StaffMember> {
    await this.assertActionable(actorRole, targetId);

    await this.employeeAuth.api.banUser({
      headers,
      body: { userId: targetId, banReason: dto.banReason },
    });

    return this.getById(targetId);
  }

  async unban(
    actorRole: EmployeeRole,
    headers: Headers,
    targetId: string,
  ): Promise<StaffMember> {
    await this.assertActionable(actorRole, targetId);

    await this.employeeAuth.api.unbanUser({
      headers,
      body: { userId: targetId },
    });

    return this.getById(targetId);
  }

  async remove(
    actorRole: EmployeeRole,
    headers: Headers,
    targetId: string,
  ): Promise<{ success: boolean }> {
    await this.assertActionable(actorRole, targetId);

    const result = await this.employeeAuth.api.removeUser({
      headers,
      body: { userId: targetId },
    });

    return { success: result.success };
  }

  private getById(id: string): Promise<StaffMember> {
    return this.prisma.employeeAccount.findUniqueOrThrow({
      where: { id },
      select: STAFF_MEMBER_SELECT,
    });
  }
}
