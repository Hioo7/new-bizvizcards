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
import { createInternalRedirectSchema } from './dto/create-internal-redirect.dto';
import type { CreateInternalRedirectDto } from './dto/create-internal-redirect.dto';
import { updateInternalRedirectSchema } from './dto/update-internal-redirect.dto';
import type { UpdateInternalRedirectDto } from './dto/update-internal-redirect.dto';
import { InternalRedirectsService } from './services/internal-redirects.service';

@Controller('api/redirects/internal')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class InternalRedirectsController {
  constructor(
    private readonly internalRedirectsService: InternalRedirectsService,
  ) {}

  @Get()
  @RequirePermissions({ redirect: ['list'] })
  list() {
    return this.internalRedirectsService.list();
  }

  @Get(':id')
  @RequirePermissions({ redirect: ['get'] })
  getById(@Param('id') id: string) {
    return this.internalRedirectsService.getById(id);
  }

  @Post()
  @RequirePermissions({ redirect: ['create'] })
  create(
    @Req() request: EmployeeAuthenticatedRequest,
    @Body(new ZodValidationPipe(createInternalRedirectSchema))
    dto: CreateInternalRedirectDto,
  ) {
    return this.internalRedirectsService.create(
      dto,
      request.employeeSession.user.id,
    );
  }

  @Patch(':id')
  @RequirePermissions({ redirect: ['update'] })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateInternalRedirectSchema))
    dto: UpdateInternalRedirectDto,
  ) {
    return this.internalRedirectsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ redirect: ['delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    await this.internalRedirectsService.delete(id);
  }
}
