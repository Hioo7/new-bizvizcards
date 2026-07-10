import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type {
  CustomerModel,
  LeadFolderModel,
} from '../../../generated/prisma/models';
import {
  LEAD_FOLDER_DEFAULT_DELETE_MODE,
  type LeadFolderDeleteMode,
} from '../leads.constants';
import type { CreateLeadFolderDto } from '../dto/create-lead-folder.dto';
import type { UpdateLeadFolderDto } from '../dto/update-lead-folder.dto';

export interface DefaultLeadFolderResult {
  defaultLeadFolderId: string | null;
}

@Injectable()
export class LeadFoldersService {
  constructor(private readonly prisma: PrismaService) {}

  list(customerId: string): Promise<LeadFolderModel[]> {
    return this.prisma.leadFolder.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(
    customerId: string,
    dto: CreateLeadFolderDto,
  ): Promise<LeadFolderModel> {
    return this.prisma.leadFolder.create({
      data: { customerId, name: dto.name },
    });
  }

  async rename(
    customerId: string,
    id: string,
    dto: UpdateLeadFolderDto,
  ): Promise<LeadFolderModel> {
    await this.assertOwnership(customerId, id);
    return this.prisma.leadFolder.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async delete(
    customerId: string,
    id: string,
    mode: LeadFolderDeleteMode = LEAD_FOLDER_DEFAULT_DELETE_MODE,
  ): Promise<void> {
    await this.assertOwnership(customerId, id);

    await this.prisma.$transaction(async (tx) => {
      if (mode === 'hard') {
        await tx.lead.deleteMany({ where: { folderId: id } });
      } else {
        await tx.lead.updateMany({
          where: { folderId: id },
          data: { folderId: null },
        });
      }
      await tx.leadFolder.delete({ where: { id } });
    });
  }

  async getDefaultFolder(customerId: string): Promise<DefaultLeadFolderResult> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });
    return { defaultLeadFolderId: customer.defaultLeadFolderId };
  }

  async setDefaultFolder(
    customerId: string,
    folderId: string | null,
  ): Promise<DefaultLeadFolderResult> {
    if (folderId !== null) {
      await this.assertOwnership(customerId, folderId);
    }

    const updated: CustomerModel = await this.prisma.customer.update({
      where: { id: customerId },
      data: { defaultLeadFolderId: folderId },
    });

    return { defaultLeadFolderId: updated.defaultLeadFolderId };
  }

  private async assertOwnership(
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
