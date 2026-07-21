import { extname } from 'path';
import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Patch,
  ParseFilePipe,
  Query,
  Req,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  PFP_ALLOWED_EXTENSIONS,
  PFP_ALLOWED_MIME_TYPE_PATTERN,
  PFP_MAX_SIZE_BYTES,
} from './customers.constants';
import { lookupCustomerQuerySchema } from './dto/lookup-customer-query.dto';
import type { LookupCustomerQueryDto } from './dto/lookup-customer-query.dto';
import { listCustomersQuerySchema } from './dto/list-customers-query.dto';
import type { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { CustomersService } from './services/customers.service';

@Controller('api/customers')
@UseGuards(CustomerAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('search')
  search(
    @Query(new ZodValidationPipe(listCustomersQuerySchema))
    query: ListCustomersQueryDto,
  ) {
    return this.customersService.list(query);
  }

  @Get('lookup')
  async lookupByEmail(
    @Query(new ZodValidationPipe(lookupCustomerQuerySchema))
    query: LookupCustomerQueryDto,
  ): Promise<{ id: string; name: string; email: string }> {
    const result = await this.customersService.lookupByEmail(query.email);
    if (!result) throw new NotFoundException('Customer not found');
    return result;
  }

  @Patch('me/profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  async replaceProfilePicture(
    @Req() request: CustomerAuthenticatedRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: PFP_MAX_SIZE_BYTES }),
          new FileTypeValidator({ fileType: PFP_ALLOWED_MIME_TYPE_PATTERN }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<{ pfpMediaId: string | null; pfpUrl: string }> {
    const extension = extname(file.originalname).slice(1).toLowerCase();
    if (!PFP_ALLOWED_EXTENSIONS.includes(extension)) {
      throw new UnsupportedMediaTypeException();
    }

    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );

    const result = await this.customersService.replaceProfilePicture(
      customer.id,
      {
        buffer: file.buffer,
        contentType: file.mimetype,
        originalName: file.originalname,
        extension,
      },
    );

    return { pfpMediaId: result.customer.pfpMediaId, pfpUrl: result.pfpUrl };
  }

  @Delete('me/profile-picture')
  async removeProfilePicture(
    @Req() request: CustomerAuthenticatedRequest,
  ): Promise<{ pfpMediaId: string | null }> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );

    const updated = await this.customersService.removeProfilePicture(
      customer.id,
    );

    return { pfpMediaId: updated.pfpMediaId };
  }
}
