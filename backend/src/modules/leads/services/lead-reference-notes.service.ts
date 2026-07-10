import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { LeadReferenceNoteModel } from '../../../generated/prisma/models';
import type { CreateLeadReferenceNoteDto } from '../dto/create-lead-reference-note.dto';
import type { UpdateLeadReferenceNoteDto } from '../dto/update-lead-reference-note.dto';
import { LeadsService } from './leads.service';

@Injectable()
export class LeadReferenceNotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadsService: LeadsService,
  ) {}

  async list(
    customerId: string,
    leadId: string,
  ): Promise<LeadReferenceNoteModel[]> {
    await this.leadsService.getById(customerId, leadId);
    return this.prisma.leadReferenceNote.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    customerId: string,
    leadId: string,
    dto: CreateLeadReferenceNoteDto,
  ): Promise<LeadReferenceNoteModel> {
    await this.leadsService.getById(customerId, leadId);
    return this.prisma.leadReferenceNote.create({
      data: { leadId, content: dto.content },
    });
  }

  async update(
    customerId: string,
    leadId: string,
    id: string,
    dto: UpdateLeadReferenceNoteDto,
  ): Promise<LeadReferenceNoteModel> {
    await this.assertOwnership(customerId, leadId, id);
    return this.prisma.leadReferenceNote.update({
      where: { id },
      data: { content: dto.content },
    });
  }

  async delete(customerId: string, leadId: string, id: string): Promise<void> {
    await this.assertOwnership(customerId, leadId, id);
    await this.prisma.leadReferenceNote.delete({ where: { id } });
  }

  private async assertOwnership(
    customerId: string,
    leadId: string,
    id: string,
  ): Promise<void> {
    await this.leadsService.getById(customerId, leadId);
    const note = await this.prisma.leadReferenceNote.findUnique({
      where: { id },
    });
    if (!note || note.leadId !== leadId) {
      throw new NotFoundException('Reference note not found');
    }
  }
}
