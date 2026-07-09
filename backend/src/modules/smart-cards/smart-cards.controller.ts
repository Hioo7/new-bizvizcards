import { extname } from 'path';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UnsupportedMediaTypeException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import type { ZodType } from 'zod';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  SMART_CARD_IMAGE_ALLOWED_EXTENSIONS,
  SMART_CARD_IMAGE_ALLOWED_MIME_TYPE_PATTERN,
  SMART_CARD_IMAGE_MAX_SIZE_BYTES,
} from './smart-cards.constants';
import { smartCardTemplateKeyParamSchema } from './dto/smart-card-template-key.dto';
import type { SmartCardTemplateKeyParam } from './dto/smart-card-template-key.dto';
import { listSmartCardQuerySchema } from './dto/list-smart-card-query.dto';
import type { ListSmartCardQueryDto } from './dto/list-smart-card-query.dto';
import type { CreateSmartCardDto } from './dto/create-smart-card.dto';
import type { UpdateSmartCardDto } from './dto/update-smart-card.dto';
import {
  smartCardCreateSchemaRegistry,
  smartCardUpdateSchemaRegistry,
} from './templates/template-schema-registry';
import { SmartCardsService } from './services/smart-cards.service';

const FILE_VALIDATION_PIPE = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: SMART_CARD_IMAGE_MAX_SIZE_BYTES }),
    new FileTypeValidator({
      fileType: SMART_CARD_IMAGE_ALLOWED_MIME_TYPE_PATTERN,
    }),
  ],
  fileIsRequired: false,
});

function assertValidExtensions(files: Express.Multer.File[]): void {
  for (const file of files) {
    const extension = extname(file.originalname).slice(1).toLowerCase();
    if (!SMART_CARD_IMAGE_ALLOWED_EXTENSIONS.includes(extension)) {
      throw new UnsupportedMediaTypeException();
    }
  }
}

@Controller('api/smart-cards/:templateKey')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class SmartCardsController {
  constructor(private readonly smartCardsService: SmartCardsService) {}

  @Get()
  @RequirePermissions({ smartCard: ['list'] })
  list(
    @Param(
      'templateKey',
      new ZodValidationPipe(smartCardTemplateKeyParamSchema),
    )
    templateKey: SmartCardTemplateKeyParam,
    @Query(new ZodValidationPipe(listSmartCardQuerySchema))
    query: ListSmartCardQueryDto,
  ) {
    return this.smartCardsService.list(templateKey, query);
  }

  @Get(':id')
  @RequirePermissions({ smartCard: ['get'] })
  get(
    @Param(
      'templateKey',
      new ZodValidationPipe(smartCardTemplateKeyParamSchema),
    )
    templateKey: SmartCardTemplateKeyParam,
    @Param('id') id: string,
  ) {
    return this.smartCardsService.getById(templateKey, id);
  }

  @Post()
  @RequirePermissions({ smartCard: ['create'] })
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Param(
      'templateKey',
      new ZodValidationPipe(smartCardTemplateKeyParamSchema),
    )
    templateKey: SmartCardTemplateKeyParam,
    @Req() request: EmployeeAuthenticatedRequest,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body('data') rawData: string,
  ) {
    assertValidExtensions(files);
    const dto = this.parseData<CreateSmartCardDto>(
      smartCardCreateSchemaRegistry[templateKey],
      rawData,
    );
    return this.smartCardsService.create(
      templateKey,
      request.employeeSession.user.id,
      dto,
      files,
    );
  }

  @Patch(':id')
  @RequirePermissions({ smartCard: ['update'] })
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param(
      'templateKey',
      new ZodValidationPipe(smartCardTemplateKeyParamSchema),
    )
    templateKey: SmartCardTemplateKeyParam,
    @Param('id') id: string,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body('data') rawData: string,
  ) {
    assertValidExtensions(files);
    const dto = this.parseData<UpdateSmartCardDto>(
      smartCardUpdateSchemaRegistry[templateKey],
      rawData,
    );
    return this.smartCardsService.update(templateKey, id, dto, files);
  }

  @Delete(':id')
  @RequirePermissions({ smartCard: ['delete'] })
  remove(
    @Param(
      'templateKey',
      new ZodValidationPipe(smartCardTemplateKeyParamSchema),
    )
    templateKey: SmartCardTemplateKeyParam,
    @Param('id') id: string,
  ) {
    return this.smartCardsService.remove(templateKey, id);
  }

  private parseData<T>(schema: ZodType<T>, rawData: string): T {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawData) as unknown;
    } catch {
      throw new BadRequestException('Invalid JSON in "data" field');
    }
    const result = schema.safeParse(parsedJson);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }
    return result.data;
  }
}
