import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { parseMultipartJson } from '../../common/validators/parse-multipart-json';
import { CustomersService } from '../customers/services/customers.service';
import { createVirtualBackgroundSchema } from './dto/create-virtual-background.dto';
import type { CreateVirtualBackgroundDto } from './dto/create-virtual-background.dto';
import { VirtualBackgroundsService } from './services/virtual-backgrounds.service';
import {
  VIRTUAL_BACKGROUND_CUSTOM_IMAGE_FIELD,
  VIRTUAL_BACKGROUND_MULTIPART_DATA_FIELD,
} from './virtual-backgrounds.constants';

// The custom base image is optional at the HTTP layer — required only when
// dto.source === 'CUSTOM', which the service enforces after parsing.
const FILE_VALIDATION_PIPE = new ParseFilePipe({ fileIsRequired: false });

@Controller('api/customer/virtual-backgrounds')
@UseGuards(CustomerAuthGuard)
export class VirtualBackgroundsController {
  constructor(
    private readonly virtualBackgroundsService: VirtualBackgroundsService,
    private readonly customersService: CustomersService,
  ) {}

  @Get('templates')
  async listTemplates(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.virtualBackgroundsService.listAvailableTemplates(customer.id);
  }

  @Get()
  async list(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.virtualBackgroundsService.listForCustomer(customer.id);
  }

  @Post()
  @UseInterceptors(FileInterceptor(VIRTUAL_BACKGROUND_CUSTOM_IMAGE_FIELD))
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @UploadedFile(FILE_VALIDATION_PIPE) file: Express.Multer.File | undefined,
    @Body(VIRTUAL_BACKGROUND_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const dto = parseMultipartJson<CreateVirtualBackgroundDto>(
      createVirtualBackgroundSchema,
      rawData,
    );
    return this.virtualBackgroundsService.createForCustomer(
      customer.id,
      dto,
      file,
    );
  }

  @Delete(':id')
  async remove(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.virtualBackgroundsService.removeForCustomer(customer.id, id);
  }
}
