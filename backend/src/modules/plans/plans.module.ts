import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { CustomerPlanController } from './customer-plan.controller';
import { PlanAssignmentsController } from './plan-assignments.controller';
import { PlansController } from './plans.controller';
import { PlanAssignmentsService } from './services/plan-assignments.service';
import { PlanEnforcementService } from './services/plan-enforcement.service';
import { PlanPolicyResolverService } from './services/plan-policy-resolver.service';
import { PlansService } from './services/plans.service';

@Module({
  imports: [CustomersModule],
  controllers: [
    PlansController,
    PlanAssignmentsController,
    CustomerPlanController,
  ],
  providers: [
    PlansService,
    PlanAssignmentsService,
    PlanPolicyResolverService,
    PlanEnforcementService,
  ],
  exports: [
    PlansService,
    PlanAssignmentsService,
    PlanPolicyResolverService,
    PlanEnforcementService,
  ],
})
export class PlansModule {}
