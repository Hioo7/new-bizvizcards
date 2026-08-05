import { extname } from 'path';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  UnsupportedMediaTypeException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { parseMultipartJson } from '../../common/validators/parse-multipart-json';
import { CustomersService } from '../customers/services/customers.service';
import {
  createEmailSignatureSchema,
  type CreateEmailSignatureDto,
} from './dto/create-email-signature.dto';
import {
  updateEmailSignatureSchema,
  type UpdateEmailSignatureDto,
} from './dto/update-email-signature.dto';
import {
  previewEmailSignatureSchema,
  type PreviewEmailSignatureDto,
} from './dto/preview-email-signature.dto';
import {
  EMAIL_SIGNATURE_IMAGE_ALLOWED_EXTENSIONS,
  EMAIL_SIGNATURE_IMAGE_ALLOWED_MIME_TYPE_PATTERN,
  EMAIL_SIGNATURE_IMAGE_MAX_SIZE_BYTES,
  EMAIL_SIGNATURE_MULTIPART_DATA_FIELD,
  EMAIL_SIGNATURE_NOT_FOUND_MESSAGE,
} from './email-signatures.constants';
import { EmailSignaturesService } from './services/email-signatures.service';

const FILE_VALIDATION_PIPE = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: EMAIL_SIGNATURE_IMAGE_MAX_SIZE_BYTES }),
    new FileTypeValidator({
      fileType: EMAIL_SIGNATURE_IMAGE_ALLOWED_MIME_TYPE_PATTERN,
    }),
  ],
  fileIsRequired: false,
});

function assertValidExtensions(files: Express.Multer.File[]): void {
  for (const file of files) {
    const extension = extname(file.originalname).slice(1).toLowerCase();
    if (!EMAIL_SIGNATURE_IMAGE_ALLOWED_EXTENSIONS.includes(extension)) {
      throw new UnsupportedMediaTypeException();
    }
  }
}

// Personal email-signature management for the logged-in customer — no
// admin/employee surface exists for v1 (see the feature's design decisions),
// so this is the only controller in the module. Mirrors
// CustomerExchangeContactFormsController's shape (same guard, same
// "resolve customer via customersService.getByAccountId" boilerplate per
// handler, same 404-not-403 ownership convention) and SmartCardsController's
// multipart-upload shape (AnyFilesInterceptor + a JSON "data" field).
@Controller('api/email-signatures')
@UseGuards(CustomerAuthGuard)
export class CustomerEmailSignaturesController {
  constructor(
    private readonly emailSignaturesService: EmailSignaturesService,
    private readonly customersService: CustomersService,
  ) {}

  @Get('me')
  async listMine(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.emailSignaturesService.listForCustomer(customer.id);
  }

  @Get('me/:id')
  async getMine(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.getOwnedSignatureOrThrow(id, customer.id);
  }

  @Post('me')
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body(EMAIL_SIGNATURE_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidExtensions(files);
    const dto = parseMultipartJson<CreateEmailSignatureDto>(
      createEmailSignatureSchema,
      rawData,
    );
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.emailSignaturesService.create(
      { ...dto, customerId: customer.id },
      files,
    );
  }

  @Patch('me/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body(EMAIL_SIGNATURE_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidExtensions(files);
    const dto = parseMultipartJson<UpdateEmailSignatureDto>(
      updateEmailSignatureSchema,
      rawData,
    );
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.getOwnedSignatureOrThrow(id, customer.id);
    return this.emailSignaturesService.update(id, dto, files);
  }

  @Delete('me/:id')
  async remove(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.getOwnedSignatureOrThrow(id, customer.id);
    await this.emailSignaturesService.delete(id);
  }

  // Non-persisting render, used for the debounced live preview while a
  // customer is editing a draft — no ownership check needed since it isn't
  // tied to an existing resource id.
  @Post('me/preview')
  preview(
    @Body(new ZodValidationPipe(previewEmailSignatureSchema))
    dto: PreviewEmailSignatureDto,
  ) {
    return this.emailSignaturesService.renderPreview(dto);
  }

  // Fetches the signature by id and confirms it belongs to the given
  // customer, throwing 404 (not 403) either way so a foreign signature's
  // existence isn't leaked to a customer who doesn't own it.
  private async getOwnedSignatureOrThrow(id: string, customerId: string) {
    const signature = await this.emailSignaturesService.getById(id);
    if (signature.customerId !== customerId) {
      throw new NotFoundException(EMAIL_SIGNATURE_NOT_FOUND_MESSAGE);
    }
    return signature;
  }
}
