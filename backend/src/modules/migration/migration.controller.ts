import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { listMigrationJobsQuerySchema } from './dto/list-migration-jobs-query.dto';
import type { ListMigrationJobsQueryDto } from './dto/list-migration-jobs-query.dto';
import { listMigrationRecordsQuerySchema } from './dto/list-migration-records-query.dto';
import type { ListMigrationRecordsQueryDto } from './dto/list-migration-records-query.dto';
import { MigrationOrchestratorService } from './services/migration-orchestrator.service';
import { MigrationJobsService } from './services/migration-jobs.service';
import { MigrationPreflightService } from './services/migration-preflight.service';

@Controller('api/migration')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class MigrationController {
  constructor(
    private readonly orchestrator: MigrationOrchestratorService,
    private readonly migrationJobsService: MigrationJobsService,
    private readonly preflightService: MigrationPreflightService,
  ) {}

  @Get('preflight')
  @RequirePermissions({ migration: ['get'] })
  preflight() {
    return this.preflightService.runAll();
  }

  @Post('jobs')
  @RequirePermissions({ migration: ['run'] })
  start(@Req() request: EmployeeAuthenticatedRequest) {
    return this.orchestrator.start(request.employeeSession.user.id);
  }

  @Get('jobs')
  @RequirePermissions({ migration: ['list'] })
  list(
    @Query(new ZodValidationPipe(listMigrationJobsQuerySchema))
    query: ListMigrationJobsQueryDto,
  ) {
    return this.migrationJobsService.list(query);
  }

  @Get('jobs/:id')
  @RequirePermissions({ migration: ['get'] })
  getById(@Param('id') id: string) {
    return this.migrationJobsService.getByIdOrThrow(id);
  }

  @Get('jobs/:id/records')
  @RequirePermissions({ migration: ['get'] })
  listRecords(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(listMigrationRecordsQuerySchema))
    query: ListMigrationRecordsQueryDto,
  ) {
    return this.migrationJobsService.listRecords(id, query);
  }
}
