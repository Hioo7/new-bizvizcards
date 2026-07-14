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
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ecardAnalyticsQuerySchema } from '../ecard-analytics/dto/ecard-analytics-query.dto';
import type { EcardAnalyticsQueryDto } from '../ecard-analytics/dto/ecard-analytics-query.dto';
import { EcardAnalyticsService } from '../ecard-analytics/services/ecard-analytics.service';
import { ECardEventType } from '../../generated/prisma/client';
import { createEcardAsEmployeeSchema } from './dto/create-ecard.dto';
import type { CreateEcardAsEmployeeDto } from './dto/create-ecard.dto';
import { listEcardQuerySchema } from './dto/list-ecard-query.dto';
import type { ListEcardQueryDto } from './dto/list-ecard-query.dto';
import { updateEcardSchema } from './dto/update-ecard.dto';
import type { UpdateEcardDto } from './dto/update-ecard.dto';
import { ECARD_MULTIPART_DATA_FIELD } from './ecards.constants';
import { EcardsService } from './services/ecards.service';
import { EcardGoogleWalletService } from './services/ecard-google-wallet.service';
import { EcardAppleWalletService } from './services/ecard-apple-wallet.service';
import { assertValidEcardFiles } from './utils/assert-valid-ecard-files';
import { parseMultipartJson } from './utils/parse-multipart-json';

// Per-field mime/extension/size rules (image vs brochure PDF) are enforced
// by assertValidEcardFiles below — a single blanket ParseFilePipe validator
// can't express "different rules per field", so this pipe only checks shape.
const FILE_VALIDATION_PIPE = new ParseFilePipe({ fileIsRequired: false });

@Controller('api/employee/ecards')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class EmployeeEcardsController {
  constructor(
    private readonly ecardsService: EcardsService,
    private readonly ecardAnalyticsService: EcardAnalyticsService,
    private readonly ecardGoogleWalletService: EcardGoogleWalletService,
    private readonly ecardAppleWalletService: EcardAppleWalletService,
  ) {}

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

  @Get(':id/analytics')
  @RequirePermissions({ eCard: ['get'] })
  async getAnalytics(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(ecardAnalyticsQuerySchema))
    query: EcardAnalyticsQueryDto,
  ) {
    return this.ecardAnalyticsService.getSummary(id, query);
  }

  @Get(':id/wallet/google')
  @RequirePermissions({ eCard: ['get'] })
  async googleWallet(@Param('id') id: string) {
    const card = await this.ecardsService.getById(id);
    const url = await this.ecardGoogleWalletService.buildSaveUrl(card);
    await this.ecardAnalyticsService.recordEvent(
      card.id,
      ECardEventType.WALLET_SAVE,
    );
    return { url };
  }

  @Get(':id/wallet/apple')
  @RequirePermissions({ eCard: ['get'] })
  async appleWallet(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const card = await this.ecardsService.getById(id);
    const buffer = this.ecardAppleWalletService.buildPass(card);
    await this.ecardAnalyticsService.recordEvent(
      card.id,
      ECardEventType.WALLET_SAVE,
    );

    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${card.endpoint}.pkpass"`,
    );
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
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
