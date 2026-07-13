import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
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
import {
  ECARD_IMAGE_ALLOWED_MIME_TYPE_PATTERN,
  ECARD_IMAGE_MAX_SIZE_BYTES,
  ECARD_MULTIPART_DATA_FIELD,
} from './ecards.constants';
import { EcardsService } from './services/ecards.service';
import { assertValidImageExtensions } from './utils/assert-valid-image-extensions';
import { parseMultipartJson } from './utils/parse-multipart-json';

const FILE_VALIDATION_PIPE = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: ECARD_IMAGE_MAX_SIZE_BYTES }),
    new FileTypeValidator({ fileType: ECARD_IMAGE_ALLOWED_MIME_TYPE_PATTERN }),
  ],
  fileIsRequired: false,
});

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
    assertValidImageExtensions(files);
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
    assertValidImageExtensions(files);
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
