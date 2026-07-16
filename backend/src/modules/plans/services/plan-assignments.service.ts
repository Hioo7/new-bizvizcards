import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PlanBusinessModelType } from '../../../generated/prisma/client';
import {
  PLAN_ASSIGN_ALREADY_ACTIVE_MESSAGE,
  PLAN_NOT_FOUND_MESSAGE,
  PLAN_RENEW_REQUIRES_ACTIVE_MESSAGE,
  PLAN_SWITCH_REQUIRES_ACTIVE_MESSAGE,
  PLAN_TRIAL_ALREADY_USED_MESSAGE,
} from '../plans.constants';

interface PlanForAssignment {
  id: string;
  businessModelType: PlanBusinessModelType;
  subscriptionDurationMonths: number | null;
}

export interface PlanPurchaseHistoryEntry {
  id: string;
  planId: string;
  planName: string;
  startedAt: Date;
  expiresAt: Date | null;
  businessModelTypeAtPurchase: PlanBusinessModelType;
  assignedByEmployeeId: string;
}

/**
 * Write-side plan lifecycle for a customer: assign/switch/renew/cancel.
 * Every assignment writes a new PlanPurchaseHistory row — history rows are
 * never mutated once created.
 */
@Injectable()
export class PlanAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async assign(
    customerId: string,
    planId: string,
    actorAccountId: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      select: { currentPlanId: true },
    });
    if (customer.currentPlanId) {
      throw new ConflictException(PLAN_ASSIGN_ALREADY_ACTIVE_MESSAGE);
    }

    const plan = await this.getPlanOrThrow(planId);
    await this.assertTrialNotAlreadyUsed(customerId, plan);
    const employee = await this.getEmployeeByAccountIdOrThrow(actorAccountId);
    await this.applyAssignment(customerId, plan, employee.id);
  }

  async switchPlan(
    customerId: string,
    planId: string,
    actorAccountId: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      select: { currentPlanId: true },
    });
    if (!customer.currentPlanId) {
      throw new ConflictException(PLAN_SWITCH_REQUIRES_ACTIVE_MESSAGE);
    }

    const plan = await this.getPlanOrThrow(planId);
    await this.assertTrialNotAlreadyUsed(customerId, plan);
    const employee = await this.getEmployeeByAccountIdOrThrow(actorAccountId);
    await this.applyAssignment(customerId, plan, employee.id);
  }

  async renew(customerId: string, actorAccountId: string): Promise<void> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      select: { currentPlanId: true },
    });
    if (!customer.currentPlanId) {
      throw new ConflictException(PLAN_RENEW_REQUIRES_ACTIVE_MESSAGE);
    }

    const plan = await this.getPlanOrThrow(customer.currentPlanId);
    const employee = await this.getEmployeeByAccountIdOrThrow(actorAccountId);
    await this.applyAssignment(customerId, plan, employee.id);
  }

  async cancel(customerId: string): Promise<void> {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { currentPlanId: null },
    });
  }

  async listPurchaseHistory(
    customerId: string,
  ): Promise<PlanPurchaseHistoryEntry[]> {
    const history = await this.prisma.planPurchaseHistory.findMany({
      where: { customerId },
      include: { plan: { select: { name: true } } },
      orderBy: { startedAt: 'desc' },
    });
    return history.map((entry) => ({
      id: entry.id,
      planId: entry.planId,
      planName: entry.plan.name,
      startedAt: entry.startedAt,
      expiresAt: entry.expiresAt,
      businessModelTypeAtPurchase: entry.businessModelTypeAtPurchase,
      assignedByEmployeeId: entry.assignedByEmployeeId,
    }));
  }

  private async getEmployeeByAccountIdOrThrow(
    actorAccountId: string,
  ): Promise<{ id: string }> {
    return this.prisma.employee.findUniqueOrThrow({
      where: { accountId: actorAccountId },
      select: { id: true },
    });
  }

  private async getPlanOrThrow(planId: string): Promise<PlanForAssignment> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        businessModelType: true,
        subscriptionDurationMonths: true,
      },
    });
    if (!plan) {
      throw new NotFoundException(PLAN_NOT_FOUND_MESSAGE);
    }
    return plan;
  }

  private async assertTrialNotAlreadyUsed(
    customerId: string,
    plan: PlanForAssignment,
  ): Promise<void> {
    if (plan.businessModelType !== PlanBusinessModelType.TRIAL) {
      return;
    }
    const priorUsage = await this.prisma.planPurchaseHistory.findFirst({
      where: { customerId, planId: plan.id },
    });
    if (priorUsage) {
      throw new ConflictException(PLAN_TRIAL_ALREADY_USED_MESSAGE);
    }
  }

  private async applyAssignment(
    customerId: string,
    plan: PlanForAssignment,
    assignedByEmployeeId: string,
  ): Promise<void> {
    const expiresAt = this.computeExpiresAt(plan);
    await this.prisma.$transaction([
      this.prisma.customer.update({
        where: { id: customerId },
        data: { currentPlanId: plan.id },
      }),
      this.prisma.planPurchaseHistory.create({
        data: {
          customerId,
          planId: plan.id,
          assignedByEmployeeId,
          expiresAt,
          businessModelTypeAtPurchase: plan.businessModelType,
        },
      }),
    ]);
  }

  private computeExpiresAt(plan: PlanForAssignment): Date | null {
    if (
      plan.businessModelType === PlanBusinessModelType.SUBSCRIPTION &&
      plan.subscriptionDurationMonths
    ) {
      const expiresAt = new Date();
      expiresAt.setMonth(
        expiresAt.getMonth() + plan.subscriptionDurationMonths,
      );
      return expiresAt;
    }
    // ONE_TIME and TRIAL are treated as lifetime (no date-based expiry) this
    // pass — no trial duration was specified in scope, so a trial's only
    // enforcement is the once-per-customer rule above.
    return null;
  }
}
