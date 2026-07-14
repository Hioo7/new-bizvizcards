import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { ecardAnalyticsQuerySchema } from '../ecard-analytics/dto/ecard-analytics-query.dto';
import type { EcardAnalyticsQueryDto } from '../ecard-analytics/dto/ecard-analytics-query.dto';
import { EcardAnalyticsService } from '../ecard-analytics/services/ecard-analytics.service';
import { ECardEventType } from '../../generated/prisma/client';
import { createEcardSchema } from './dto/create-ecard.dto';
import type { CreateEcardDto } from './dto/create-ecard.dto';
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

@Controller('api/ecards')
@UseGuards(CustomerAuthGuard)
export class EcardsController {
  constructor(
    private readonly ecardsService: EcardsService,
    private readonly customersService: CustomersService,
    private readonly ecardAnalyticsService: EcardAnalyticsService,
    private readonly ecardGoogleWalletService: EcardGoogleWalletService,
    private readonly ecardAppleWalletService: EcardAppleWalletService,
  ) {}

  @Get('me')
  async listMine(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.ecardsService.listByCustomerId(customer.id);
  }

  @Get('me/:ecardId/analytics')
  async getMineAnalytics(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('ecardId') ecardId: string,
    @Query(new ZodValidationPipe(ecardAnalyticsQuerySchema))
    query: EcardAnalyticsQueryDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const card = await this.getOwnedCardOrThrow(ecardId, customer.id);
    return this.ecardAnalyticsService.getSummary(card.id, query);
  }

  @Get('me/:ecardId/wallet/google')
  async googleWalletMine(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('ecardId') ecardId: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const card = await this.getOwnedCardOrThrow(ecardId, customer.id);

    const url = await this.ecardGoogleWalletService.buildSaveUrl(card);
    await this.ecardAnalyticsService.recordEvent(
      card.id,
      ECardEventType.WALLET_SAVE,
    );
    return { url };
  }

  @Get('me/:ecardId/wallet/apple')
  async appleWalletMine(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('ecardId') ecardId: string,
    @Res() res: Response,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const card = await this.getOwnedCardOrThrow(ecardId, customer.id);

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
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body(ECARD_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidEcardFiles(files);
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const dto = parseMultipartJson<CreateEcardDto>(createEcardSchema, rawData);
    return this.ecardsService.createForCustomer(customer.id, dto, files);
  }

  @Patch('me/:ecardId')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('ecardId') ecardId: string,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body(ECARD_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidEcardFiles(files);
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.getOwnedCardOrThrow(ecardId, customer.id);
    const dto = parseMultipartJson<UpdateEcardDto>(updateEcardSchema, rawData);
    return this.ecardsService.updateById(ecardId, dto, files);
  }

  @Delete('me/:ecardId')
  async remove(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('ecardId') ecardId: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.getOwnedCardOrThrow(ecardId, customer.id);
    await this.ecardsService.removeById(ecardId);
  }

  // Fetches the card by id and confirms it belongs to the given customer,
  // throwing 404 (not 403) either way so a foreign card's existence isn't
  // leaked to a customer who doesn't own it.
  private async getOwnedCardOrThrow(ecardId: string, customerId: string) {
    const card = await this.ecardsService.getById(ecardId);
    if (card.customerId !== customerId) {
      throw new NotFoundException('E-card not found');
    }
    return card;
  }
}
