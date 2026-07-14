import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { listOrganisationsQuerySchema } from './dto/list-organisations-query.dto';
import type { ListOrganisationsQueryDto } from './dto/list-organisations-query.dto';
import { OrganisationMembersService } from './services/organisation-members.service';
import { OrganisationsService } from './services/organisations.service';

@Controller('api/employee/organisations')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class EmployeeOrganisationsController {
  constructor(
    private readonly organisationsService: OrganisationsService,
    private readonly organisationMembersService: OrganisationMembersService,
  ) {}

  @Get()
  @RequirePermissions({ organisation: ['list'] })
  list(
    @Query(new ZodValidationPipe(listOrganisationsQuerySchema))
    query: ListOrganisationsQueryDto,
  ) {
    return this.organisationsService.listAllForEmployee(query);
  }

  @Get('by-customer/:customerId')
  @RequirePermissions({ organisation: ['get'] })
  listMembershipsByCustomer(@Param('customerId') customerId: string) {
    return this.organisationsService.listMembershipsWithOrgDetails(customerId);
  }

  @Get(':organisationId/members')
  @RequirePermissions({ organisation: ['get'] })
  listMembersByOrganisation(@Param('organisationId') organisationId: string) {
    return this.organisationMembersService.listByOrganisationId(organisationId);
  }

  @Delete('members/:id')
  @RequirePermissions({ organisation: ['delete'] })
  async removeMember(@Param('id') id: string): Promise<void> {
    await this.organisationMembersService.removeForEmployee(id);
  }

  @Get(':id')
  @RequirePermissions({ organisation: ['get'] })
  get(@Param('id') id: string) {
    return this.organisationsService.getByIdForEmployee(id);
  }

  @Delete(':id')
  @RequirePermissions({ organisation: ['delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    await this.organisationsService.removeForEmployee(id);
  }
}
