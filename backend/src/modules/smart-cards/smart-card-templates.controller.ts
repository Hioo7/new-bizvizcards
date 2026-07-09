import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { smartCardTemplateKeyParamSchema } from './dto/smart-card-template-key.dto';
import type { SmartCardTemplateKeyParam } from './dto/smart-card-template-key.dto';
import { SmartCardTemplatesService } from './services/smart-card-templates.service';

@Controller('api/smart-card-templates')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class SmartCardTemplatesController {
  constructor(private readonly templatesService: SmartCardTemplatesService) {}

  @Get()
  @RequirePermissions({ smartCardTemplate: ['list'] })
  list() {
    return this.templatesService.list();
  }

  @Get(':key')
  @RequirePermissions({ smartCardTemplate: ['get'] })
  get(
    @Param('key', new ZodValidationPipe(smartCardTemplateKeyParamSchema))
    key: SmartCardTemplateKeyParam,
  ) {
    return this.templatesService.getByKey(key);
  }
}
