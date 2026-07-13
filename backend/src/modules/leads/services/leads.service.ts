import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LeadSourceType } from '../../../generated/prisma/client';
import type { LeadModel } from '../../../generated/prisma/models';
import type { CreateLeadDto } from '../dto/create-lead.dto';
import type { ExchangeContactDto } from '../dto/exchange-contact.dto';
import type { ListLeadsQueryDto } from '../dto/list-leads-query.dto';
import type { UpdateLeadDto } from '../dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromExchangeContact(
    endpoint: string,
    dto: ExchangeContactDto,
  ): Promise<LeadModel> {
    const smartCard = await this.prisma.smartCard.findUnique({
      where: { endpoint },
      select: {
        id: true,
        customerId: true,
        customer: { select: { defaultLeadFolderId: true } },
      },
    });

    if (!smartCard || !smartCard.customerId || !smartCard.customer) {
      throw new NotFoundException('Smart card not found');
    }

    return this.createLeadFromExchange(
      smartCard.customerId,
      smartCard.customer.defaultLeadFolderId,
      LeadSourceType.SMART_CARD,
      dto,
    );
  }

  async createFromEcardExchangeContact(
    endpoint: string,
    dto: ExchangeContactDto,
  ): Promise<LeadModel> {
    const ecard = await this.prisma.eCard.findUnique({
      where: { endpoint },
      select: {
        id: true,
        customerId: true,
        customer: { select: { defaultLeadFolderId: true } },
      },
    });

    if (!ecard) {
      throw new NotFoundException('E-card not found');
    }

    return this.createLeadFromExchange(
      ecard.customerId,
      ecard.customer.defaultLeadFolderId,
      LeadSourceType.E_CARD,
      dto,
    );
  }

  private createLeadFromExchange(
    customerId: string,
    defaultLeadFolderId: string | null,
    sourcedBy: LeadSourceType,
    dto: ExchangeContactDto,
  ): Promise<LeadModel> {
    return this.prisma.lead.create({
      data: {
        customerId,
        sourcedBy,
        folderId: defaultLeadFolderId ?? undefined,
        name: dto.name,
        email: dto.email,
        countryDialCode: dto.countryDialCode,
        phoneNumber: dto.phoneNumber,
        note: dto.note,
        locationLatitude: dto.locationLatitude,
        locationLongitude: dto.locationLongitude,
      },
    });
  }

  list(customerId: string, query: ListLeadsQueryDto): Promise<LeadModel[]> {
    return this.prisma.lead.findMany({
      where: {
        customerId,
        ...(query.folderId !== undefined && { folderId: query.folderId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(customerId: string, id: string): Promise<LeadModel> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead || lead.customerId !== customerId) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  async create(customerId: string, dto: CreateLeadDto): Promise<LeadModel> {
    if (dto.folderId) {
      await this.assertFolderOwnership(customerId, dto.folderId);
    }

    return this.prisma.lead.create({
      data: {
        customerId,
        sourcedBy: LeadSourceType.MANUAL_ENTRY,
        name: dto.name,
        email: dto.email,
        countryDialCode: dto.countryDialCode,
        phoneNumber: dto.phoneNumber,
        note: dto.note,
        company: dto.company,
        profession: dto.profession,
        location: dto.location,
        locationLatitude: dto.locationLatitude,
        locationLongitude: dto.locationLongitude,
        folderId: dto.folderId,
      },
    });
  }

  async update(
    customerId: string,
    id: string,
    dto: UpdateLeadDto,
  ): Promise<LeadModel> {
    await this.getById(customerId, id);

    if (dto.folderId) {
      await this.assertFolderOwnership(customerId, dto.folderId);
    }

    return this.prisma.lead.update({
      where: { id },
      data: dto,
    });
  }

  async delete(customerId: string, id: string): Promise<void> {
    await this.getById(customerId, id);
    await this.prisma.lead.delete({ where: { id } });
  }

  private async assertFolderOwnership(
    customerId: string,
    folderId: string,
  ): Promise<void> {
    const folder = await this.prisma.leadFolder.findUnique({
      where: { id: folderId },
    });
    if (!folder || folder.customerId !== customerId) {
      throw new NotFoundException('Lead folder not found');
    }
  }
}
