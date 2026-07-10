import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createRestrictedPathSchema } from './dto/create-restricted-path.dto';
import type { CreateRestrictedPathDto } from './dto/create-restricted-path.dto';
import { RestrictedPathsService } from './services/restricted-paths.service';

@Controller('api/redirects/restricted-paths')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class RestrictedPathsController {
  constructor(
    private readonly restrictedPathsService: RestrictedPathsService,
  ) {}

  @Get()
  @RequirePermissions({ redirect: ['list'] })
  list() {
    return this.restrictedPathsService.list();
  }

  @Post()
  @RequirePermissions({ redirect: ['create'] })
  create(
    @Body(new ZodValidationPipe(createRestrictedPathSchema))
    dto: CreateRestrictedPathDto,
  ) {
    return this.restrictedPathsService.create(dto);
  }

  @Delete(':id')
  @RequirePermissions({ redirect: ['delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    await this.restrictedPathsService.delete(id);
  }
}
