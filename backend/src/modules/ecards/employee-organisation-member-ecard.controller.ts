import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { linkMemberEcardSchema } from './dto/link-member-ecard.dto';
import type { LinkMemberEcardDto } from './dto/link-member-ecard.dto';
import { EcardsService } from './services/ecards.service';

// Shares the `api/employee/organisations` route prefix with
// EmployeeOrganisationsController (a different module/controller — Ecards
// needs OrganisationMembersService, and Organisations must not depend back
// on Ecards, so this lives here instead of widening that dependency).
@Controller('api/employee/organisations')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class EmployeeOrganisationMemberEcardController {
  constructor(private readonly ecardsService: EcardsService) {}

  @Patch(':organisationId/members/:memberId/ecard')
  @RequirePermissions({ organisation: ['update'] })
  linkEcard(
    @Param('organisationId') organisationId: string,
    @Param('memberId') memberId: string,
    @Body(new ZodValidationPipe(linkMemberEcardSchema)) dto: LinkMemberEcardDto,
  ) {
    return this.ecardsService.linkEcardForEmployee(
      organisationId,
      memberId,
      dto.ecardId,
    );
  }
}
