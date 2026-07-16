import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createPlanSchema } from './dto/create-plan.dto';
import type { CreatePlanDto } from './dto/create-plan.dto';
import { listPlansQuerySchema } from './dto/list-plans-query.dto';
import type { ListPlansQueryDto } from './dto/list-plans-query.dto';
import { updatePlanSchema } from './dto/update-plan.dto';
import type { UpdatePlanDto } from './dto/update-plan.dto';
import { PlansService } from './services/plans.service';

@Controller('api/employee/plans')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @RequirePermissions({ plan: ['list'] })
  list(
    @Query(new ZodValidationPipe(listPlansQuerySchema))
    query: ListPlansQueryDto,
  ) {
    return this.plansService.list(query);
  }

  @Get(':id')
  @RequirePermissions({ plan: ['get'] })
  get(@Param('id') id: string) {
    return this.plansService.getByIdOrThrow(id);
  }

  @Post()
  @RequirePermissions({ plan: ['create'] })
  create(@Body(new ZodValidationPipe(createPlanSchema)) dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions({ plan: ['update'] })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePlanSchema)) dto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, dto);
  }

  @Patch(':id/fallback')
  @RequirePermissions({ plan: ['update'] })
  setFallback(@Param('id') id: string) {
    return this.plansService.setFallbackPlan(id);
  }

  @Delete(':id')
  @RequirePermissions({ plan: ['delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    await this.plansService.remove(id);
  }
}
