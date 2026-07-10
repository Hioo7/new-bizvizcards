import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createExternalRedirectSchema } from './dto/create-external-redirect.dto';
import type { CreateExternalRedirectDto } from './dto/create-external-redirect.dto';
import { updateExternalRedirectSchema } from './dto/update-external-redirect.dto';
import type { UpdateExternalRedirectDto } from './dto/update-external-redirect.dto';
import { ExternalRedirectsService } from './services/external-redirects.service';

@Controller('api/redirects/external')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class ExternalRedirectsController {
  constructor(
    private readonly externalRedirectsService: ExternalRedirectsService,
  ) {}

  @Get()
  @RequirePermissions({ redirect: ['list'] })
  list() {
    return this.externalRedirectsService.list();
  }

  @Get(':id')
  @RequirePermissions({ redirect: ['get'] })
  getById(@Param('id') id: string) {
    return this.externalRedirectsService.getById(id);
  }

  @Post()
  @RequirePermissions({ redirect: ['create'] })
  create(
    @Req() request: EmployeeAuthenticatedRequest,
    @Body(new ZodValidationPipe(createExternalRedirectSchema))
    dto: CreateExternalRedirectDto,
  ) {
    return this.externalRedirectsService.create(
      dto,
      request.employeeSession.user.id,
    );
  }

  @Patch(':id')
  @RequirePermissions({ redirect: ['update'] })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateExternalRedirectSchema))
    dto: UpdateExternalRedirectDto,
  ) {
    return this.externalRedirectsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ redirect: ['delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    await this.externalRedirectsService.delete(id);
  }
}
