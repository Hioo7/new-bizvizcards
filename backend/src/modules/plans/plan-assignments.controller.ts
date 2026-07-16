import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { assignPlanSchema } from './dto/assign-plan.dto';
import type { AssignPlanDto } from './dto/assign-plan.dto';
import { switchPlanSchema } from './dto/switch-plan.dto';
import type { SwitchPlanDto } from './dto/switch-plan.dto';
import { PlanAssignmentsService } from './services/plan-assignments.service';
import { PlanPolicyResolverService } from './services/plan-policy-resolver.service';

// Assign/renew/switch/cancel all map to plan:['update'] — every employee
// tier already has that action, so any employee can manage a customer's
// plan assignment; only Plan CRUD delete is admin/super_admin-gated.
@Controller('api/employee/customers/:customerId/plan')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class PlanAssignmentsController {
  constructor(
    private readonly planAssignmentsService: PlanAssignmentsService,
    private readonly policyResolver: PlanPolicyResolverService,
  ) {}

  @Post('assign')
  @RequirePermissions({ plan: ['update'] })
  async assign(
    @Req() request: EmployeeAuthenticatedRequest,
    @Param('customerId') customerId: string,
    @Body(new ZodValidationPipe(assignPlanSchema)) dto: AssignPlanDto,
  ): Promise<void> {
    await this.planAssignmentsService.assign(
      customerId,
      dto.planId,
      request.employeeSession.user.id,
    );
  }

  @Post('switch')
  @RequirePermissions({ plan: ['update'] })
  async switchPlan(
    @Req() request: EmployeeAuthenticatedRequest,
    @Param('customerId') customerId: string,
    @Body(new ZodValidationPipe(switchPlanSchema)) dto: SwitchPlanDto,
  ): Promise<void> {
    await this.planAssignmentsService.switchPlan(
      customerId,
      dto.planId,
      request.employeeSession.user.id,
    );
  }

  @Post('renew')
  @RequirePermissions({ plan: ['update'] })
  async renew(
    @Req() request: EmployeeAuthenticatedRequest,
    @Param('customerId') customerId: string,
  ): Promise<void> {
    await this.planAssignmentsService.renew(
      customerId,
      request.employeeSession.user.id,
    );
  }

  @Post('cancel')
  @RequirePermissions({ plan: ['update'] })
  async cancel(@Param('customerId') customerId: string): Promise<void> {
    await this.planAssignmentsService.cancel(customerId);
  }

  @Get('history')
  @RequirePermissions({ plan: ['get'] })
  listHistory(@Param('customerId') customerId: string) {
    return this.planAssignmentsService.listPurchaseHistory(customerId);
  }

  @Get('effective-policy')
  @RequirePermissions({ plan: ['get'] })
  getEffectivePolicy(@Param('customerId') customerId: string) {
    return this.policyResolver.getEffectivePolicyForCustomer(customerId);
  }
}
