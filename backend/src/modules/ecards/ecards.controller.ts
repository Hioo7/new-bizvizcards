import {
  Body,
  Controller,
  Delete,
  Get,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { CustomersService } from '../customers/services/customers.service';
import { createEcardSchema } from './dto/create-ecard.dto';
import type { CreateEcardDto } from './dto/create-ecard.dto';
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

@Controller('api/ecards')
@UseGuards(CustomerAuthGuard)
export class EcardsController {
  constructor(
    private readonly ecardsService: EcardsService,
    private readonly customersService: CustomersService,
  ) {}

  @Get('me')
  async getMine(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.ecardsService.getByCustomerId(customer.id);
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

  @Patch('me')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body(ECARD_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidEcardFiles(files);
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const dto = parseMultipartJson<UpdateEcardDto>(updateEcardSchema, rawData);
    return this.ecardsService.updateByCustomerId(customer.id, dto, files);
  }

  @Delete('me')
  async remove(@Req() request: CustomerAuthenticatedRequest): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.ecardsService.removeByCustomerId(customer.id);
  }
}
