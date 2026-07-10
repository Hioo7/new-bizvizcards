import { Injectable, NotFoundException } from '@nestjs/common';
import { MILLISECONDS_PER_MINUTE } from '../../../common/constants/time.constants';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ReminderStatus } from '../../../generated/prisma/client';
import type { LeadReminderModel } from '../../../generated/prisma/models';
import type { CreateLeadReminderDto } from '../dto/create-lead-reminder.dto';
import type { UpdateLeadReminderDto } from '../dto/update-lead-reminder.dto';
import { LeadsService } from './leads.service';

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadsService: LeadsService,
  ) {}

  async list(customerId: string, leadId: string): Promise<LeadReminderModel[]> {
    await this.leadsService.getById(customerId, leadId);
    return this.prisma.leadReminder.findMany({
      where: { leadId },
      orderBy: { triggerAt: 'asc' },
    });
  }

  async create(
    customerId: string,
    leadId: string,
    dto: CreateLeadReminderDto,
  ): Promise<LeadReminderModel> {
    await this.leadsService.getById(customerId, leadId);
    return this.prisma.leadReminder.create({
      data: {
        leadId,
        title: dto.title,
        text: dto.text,
        triggerAt: dto.triggerAt,
      },
    });
  }

  async update(
    customerId: string,
    leadId: string,
    id: string,
    dto: UpdateLeadReminderDto,
  ): Promise<LeadReminderModel> {
    await this.assertOwnership(customerId, leadId, id);
    return this.prisma.leadReminder.update({
      where: { id },
      data: dto,
    });
  }

  async delete(customerId: string, leadId: string, id: string): Promise<void> {
    await this.assertOwnership(customerId, leadId, id);
    await this.prisma.leadReminder.delete({ where: { id } });
  }

  async getDue(
    customerId: string,
    withinMinutes: number,
  ): Promise<LeadReminderModel[]> {
    const threshold = new Date(
      Date.now() + withinMinutes * MILLISECONDS_PER_MINUTE,
    );
    return this.prisma.leadReminder.findMany({
      where: {
        status: ReminderStatus.PENDING,
        triggerAt: { lte: threshold },
        lead: { customerId },
      },
      orderBy: { triggerAt: 'asc' },
    });
  }

  private async assertOwnership(
    customerId: string,
    leadId: string,
    id: string,
  ): Promise<void> {
    await this.leadsService.getById(customerId, leadId);
    const reminder = await this.prisma.leadReminder.findUnique({
      where: { id },
    });
    if (!reminder || reminder.leadId !== leadId) {
      throw new NotFoundException('Reminder not found');
    }
  }
}
