import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { parseMultipartJson } from '../../common/validators/parse-multipart-json';
import { createVirtualBackgroundTemplateSchema } from './dto/create-virtual-background-template.dto';
import type { CreateVirtualBackgroundTemplateDto } from './dto/create-virtual-background-template.dto';
import { VirtualBackgroundTemplatesService } from './services/virtual-background-templates.service';
import { assertValidVirtualBackgroundImageFile } from './utils/assert-valid-virtual-background-image-file';
import {
  VIRTUAL_BACKGROUND_TEMPLATE_IMAGE_FIELD,
  VIRTUAL_BACKGROUND_TEMPLATE_MULTIPART_DATA_FIELD,
} from './virtual-backgrounds.constants';

// A single image file per request, no other files (unlike ecards' multi-file
// AnyFilesInterceptor) — this shape check only, per-field rules live in
// assertValidVirtualBackgroundImageFile below.
const FILE_VALIDATION_PIPE = new ParseFilePipe({ fileIsRequired: true });

@Controller('api/employee/virtual-background-templates')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class VirtualBackgroundTemplatesController {
  constructor(
    private readonly templatesService: VirtualBackgroundTemplatesService,
  ) {}

  @Get()
  @RequirePermissions({ plan: ['list'] })
  list() {
    return this.templatesService.list();
  }

  @Post()
  @RequirePermissions({ plan: ['create'] })
  @UseInterceptors(FileInterceptor(VIRTUAL_BACKGROUND_TEMPLATE_IMAGE_FIELD))
  async create(
    @UploadedFile(FILE_VALIDATION_PIPE) file: Express.Multer.File,
    @Body(VIRTUAL_BACKGROUND_TEMPLATE_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidVirtualBackgroundImageFile(file);
    const dto = parseMultipartJson<CreateVirtualBackgroundTemplateDto>(
      createVirtualBackgroundTemplateSchema,
      rawData,
    );
    return this.templatesService.create(dto, file);
  }

  @Delete(':id')
  @RequirePermissions({ plan: ['delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    await this.templatesService.remove(id);
  }
}
