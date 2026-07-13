import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createEcardAsEmployeeSchema } from './dto/create-ecard.dto';
import type { CreateEcardAsEmployeeDto } from './dto/create-ecard.dto';
import { listEcardQuerySchema } from './dto/list-ecard-query.dto';
import type { ListEcardQueryDto } from './dto/list-ecard-query.dto';
import { updateEcardSchema } from './dto/update-ecard.dto';
import type { UpdateEcardDto } from './dto/update-ecard.dto';
import { ECARD_MULTIPART_DATA_FIELD } from './ecards.constants';
import { EcardsService } from './services/ecards.service';
import { assertValidEcardFiles } from './utils/assert-valid-ecard-files';
import { parseMultipartJson } from './utils/parse-multipart-json';

// Per-field mime/extension/size rules (image vs brochure PDF) are enforced
// by assertValidEcardFiles below — a single blanket ParseFilePipe validator
// can't express "different rules per field", so this pipe only checks shape.
const FILE_VALIDATION_PIPE = new ParseFilePipe({ fileIsRequired: false });

@Controller('api/employee/ecards')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class EmployeeEcardsController {
  constructor(private readonly ecardsService: EcardsService) {}

  @Get()
  @RequirePermissions({ eCard: ['list'] })
  list(
    @Query(new ZodValidationPipe(listEcardQuerySchema))
    query: ListEcardQueryDto,
  ) {
    return this.ecardsService.list(query);
  }

  @Get(':id')
  @RequirePermissions({ eCard: ['get'] })
  get(@Param('id') id: string) {
    return this.ecardsService.getById(id);
  }

  @Post()
  @RequirePermissions({ eCard: ['create'] })
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Req() request: EmployeeAuthenticatedRequest,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body(ECARD_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidEcardFiles(files);
    const dto = parseMultipartJson<CreateEcardAsEmployeeDto>(
      createEcardAsEmployeeSchema,
      rawData,
    );
    return this.ecardsService.createAsEmployee(
      request.employeeSession.user.id,
      dto,
      files,
    );
  }

  @Patch(':id')
  @RequirePermissions({ eCard: ['update'] })
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id') id: string,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body(ECARD_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidEcardFiles(files);
    const dto = parseMultipartJson<UpdateEcardDto>(updateEcardSchema, rawData);
    return this.ecardsService.updateById(id, dto, files);
  }

  @Delete(':id')
  @RequirePermissions({ eCard: ['delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    await this.ecardsService.removeById(id);
  }
}
