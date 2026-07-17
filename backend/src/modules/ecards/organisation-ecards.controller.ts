import {
  Body,
  Controller,
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
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { ecardAnalyticsQuerySchema } from '../ecard-analytics/dto/ecard-analytics-query.dto';
import type { EcardAnalyticsQueryDto } from '../ecard-analytics/dto/ecard-analytics-query.dto';
import { EcardAnalyticsService } from '../ecard-analytics/services/ecard-analytics.service';
import { createEcardAsSpocSchema } from './dto/create-ecard-as-spoc.dto';
import type { CreateEcardAsSpocDto } from './dto/create-ecard-as-spoc.dto';
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

@Controller('api/organisations/:organisationId/ecards')
@UseGuards(CustomerAuthGuard)
export class OrganisationEcardsController {
  constructor(
    private readonly ecardsService: EcardsService,
    private readonly customersService: CustomersService,
    private readonly ecardAnalyticsService: EcardAnalyticsService,
  ) {}

  @Get()
  async list(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
    @Query(new ZodValidationPipe(listEcardQuerySchema))
    query: ListEcardQueryDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.ecardsService.listForOrganisationSpoc(
      customer.id,
      organisationId,
      query,
    );
  }

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body(ECARD_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidEcardFiles(files);
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const dto = parseMultipartJson<CreateEcardAsSpocDto>(
      createEcardAsSpocSchema,
      rawData,
    );
    return this.ecardsService.createForOrganisationSpoc(
      customer.id,
      organisationId,
      dto,
      files,
    );
  }

  @Patch(':ecardId')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
    @Param('ecardId') ecardId: string,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body(ECARD_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidEcardFiles(files);
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const dto = parseMultipartJson<UpdateEcardDto>(updateEcardSchema, rawData);
    return this.ecardsService.updateForOrganisationSpoc(
      customer.id,
      organisationId,
      ecardId,
      dto,
      files,
    );
  }

  @Get(':ecardId')
  async get(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
    @Param('ecardId') ecardId: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.ecardsService.getForOrganisationSpoc(
      customer.id,
      organisationId,
      ecardId,
    );
  }

  @Get(':ecardId/analytics')
  async getAnalytics(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
    @Param('ecardId') ecardId: string,
    @Query(new ZodValidationPipe(ecardAnalyticsQuerySchema))
    query: EcardAnalyticsQueryDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const card = await this.ecardsService.getForOrganisationSpoc(
      customer.id,
      organisationId,
      ecardId,
    );
    return this.ecardAnalyticsService.getSummary(card.id, query);
  }
}
