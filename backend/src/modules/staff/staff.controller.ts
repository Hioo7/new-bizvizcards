import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { headersFromExpressRequest } from '../../common/guards/base-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { requireEmployeeRole } from '../../common/constants/roles.constants';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { listStaffQuerySchema } from './dto/list-staff-query.dto';
import type { ListStaffQueryDto } from './dto/list-staff-query.dto';
import { createStaffSchema } from './dto/create-staff.dto';
import type { CreateStaffDto } from './dto/create-staff.dto';
import { updateStaffSchema } from './dto/update-staff.dto';
import type { UpdateStaffDto } from './dto/update-staff.dto';
import { setStaffRoleSchema } from './dto/set-staff-role.dto';
import type { SetStaffRoleDto } from './dto/set-staff-role.dto';
import { banStaffSchema } from './dto/ban-staff.dto';
import type { BanStaffDto } from './dto/ban-staff.dto';
import { StaffService } from './services/staff.service';

@Controller('api/staff')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @RequirePermissions({ user: ['list'] })
  list(
    @Query(new ZodValidationPipe(listStaffQuerySchema))
    query: ListStaffQueryDto,
  ) {
    return this.staffService.list(query);
  }

  @Post()
  @RequirePermissions({ user: ['create'] })
  create(
    @Req() request: EmployeeAuthenticatedRequest,
    @Body(new ZodValidationPipe(createStaffSchema)) dto: CreateStaffDto,
  ) {
    return this.staffService.create(
      requireEmployeeRole(request.employeeSession.user.role),
      headersFromExpressRequest(request.headers),
      dto,
    );
  }

  @Patch(':id')
  @RequirePermissions({ user: ['update'] })
  updateName(
    @Req() request: EmployeeAuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStaffSchema)) dto: UpdateStaffDto,
  ) {
    return this.staffService.updateName(
      requireEmployeeRole(request.employeeSession.user.role),
      headersFromExpressRequest(request.headers),
      id,
      dto,
    );
  }

  @Patch(':id/role')
  @RequirePermissions({ user: ['set-role'] })
  setRole(
    @Req() request: EmployeeAuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setStaffRoleSchema)) dto: SetStaffRoleDto,
  ) {
    return this.staffService.setRole(
      request.employeeSession.user.id,
      requireEmployeeRole(request.employeeSession.user.role),
      headersFromExpressRequest(request.headers),
      id,
      dto,
    );
  }

  @Post(':id/ban')
  @RequirePermissions({ user: ['ban'] })
  ban(
    @Req() request: EmployeeAuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(banStaffSchema)) dto: BanStaffDto,
  ) {
    return this.staffService.ban(
      requireEmployeeRole(request.employeeSession.user.role),
      headersFromExpressRequest(request.headers),
      id,
      dto,
    );
  }

  @Post(':id/unban')
  @RequirePermissions({ user: ['ban'] })
  unban(@Req() request: EmployeeAuthenticatedRequest, @Param('id') id: string) {
    return this.staffService.unban(
      requireEmployeeRole(request.employeeSession.user.role),
      headersFromExpressRequest(request.headers),
      id,
    );
  }

  @Delete(':id')
  @RequirePermissions({ user: ['delete'] })
  remove(
    @Req() request: EmployeeAuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.staffService.remove(
      requireEmployeeRole(request.employeeSession.user.role),
      headersFromExpressRequest(request.headers),
      id,
    );
  }
}
