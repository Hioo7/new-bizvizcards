import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { createLeadFolderSchema } from './dto/create-lead-folder.dto';
import type { CreateLeadFolderDto } from './dto/create-lead-folder.dto';
import { deleteLeadFolderQuerySchema } from './dto/delete-lead-folder-query.dto';
import type { DeleteLeadFolderQueryDto } from './dto/delete-lead-folder-query.dto';
import { setDefaultLeadFolderSchema } from './dto/set-default-lead-folder.dto';
import type { SetDefaultLeadFolderDto } from './dto/set-default-lead-folder.dto';
import { updateLeadFolderSchema } from './dto/update-lead-folder.dto';
import type { UpdateLeadFolderDto } from './dto/update-lead-folder.dto';
import { LeadFoldersService } from './services/lead-folders.service';

@Controller('api/lead-folders')
@UseGuards(CustomerAuthGuard)
export class LeadFoldersController {
  constructor(
    private readonly leadFoldersService: LeadFoldersService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  async list(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadFoldersService.list(customer.id);
  }

  @Get('default')
  async getDefault(@Req() request: CustomerAuthenticatedRequest) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadFoldersService.getDefaultFolder(customer.id);
  }

  @Put('default')
  async setDefault(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(setDefaultLeadFolderSchema))
    dto: SetDefaultLeadFolderDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadFoldersService.setDefaultFolder(customer.id, dto.folderId);
  }

  @Post()
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @Body(new ZodValidationPipe(createLeadFolderSchema))
    dto: CreateLeadFolderDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadFoldersService.create(customer.id, dto);
  }

  @Patch(':id')
  async rename(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLeadFolderSchema))
    dto: UpdateLeadFolderDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadFoldersService.rename(customer.id, id, dto);
  }

  @Delete(':id')
  async delete(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(deleteLeadFolderQuerySchema))
    query: DeleteLeadFolderQueryDto,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.leadFoldersService.delete(customer.id, id, query.mode);
  }
}
