import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { createLeadReferenceNoteSchema } from './dto/create-lead-reference-note.dto';
import type { CreateLeadReferenceNoteDto } from './dto/create-lead-reference-note.dto';
import { updateLeadReferenceNoteSchema } from './dto/update-lead-reference-note.dto';
import type { UpdateLeadReferenceNoteDto } from './dto/update-lead-reference-note.dto';
import { LeadReferenceNotesService } from './services/lead-reference-notes.service';

@Controller('api/leads/:leadId/reference-notes')
@UseGuards(CustomerAuthGuard)
export class LeadReferenceNotesController {
  constructor(
    private readonly leadReferenceNotesService: LeadReferenceNotesService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  async list(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('leadId') leadId: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadReferenceNotesService.list(customer.id, leadId);
  }

  @Post()
  async create(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('leadId') leadId: string,
    @Body(new ZodValidationPipe(createLeadReferenceNoteSchema))
    dto: CreateLeadReferenceNoteDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadReferenceNotesService.create(customer.id, leadId, dto);
  }

  @Patch(':id')
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('leadId') leadId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLeadReferenceNoteSchema))
    dto: UpdateLeadReferenceNoteDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.leadReferenceNotesService.update(customer.id, leadId, id, dto);
  }

  @Delete(':id')
  async delete(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('leadId') leadId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.leadReferenceNotesService.delete(customer.id, leadId, id);
  }
}
