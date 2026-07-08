import { Injectable } from '@nestjs/common';
import { ImageMediaService } from '../../../common/media/image-media.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CustomerModel } from '../../../generated/prisma/models';
import { PFP_STORAGE_KEY_PREFIX } from '../customers.constants';

export interface ProfilePictureUpload {
  buffer: Buffer;
  contentType: string;
  originalName: string;
  extension: string;
}

export interface ProfilePictureReplaceResult {
  customer: CustomerModel;
  pfpUrl: string;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageMediaService: ImageMediaService,
  ) {}

  getByAccountId(accountId: string): Promise<CustomerModel> {
    return this.prisma.customer.findUniqueOrThrow({ where: { accountId } });
  }

  async replaceProfilePicture(
    customerId: string,
    upload: ProfilePictureUpload,
  ): Promise<ProfilePictureReplaceResult> {
    const existing = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });

    const newMedia = await this.imageMediaService.upload({
      ...upload,
      keyPrefix: `${PFP_STORAGE_KEY_PREFIX}/${customerId}`,
    });
    const pfpUrl = this.imageMediaService.getPublicUrl(newMedia);

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: { pfpMediaId: newMedia.id },
    });

    if (existing.pfpMediaId) {
      await this.imageMediaService.delete(existing.pfpMediaId);
    }

    return { customer: updated, pfpUrl };
  }

  async removeProfilePicture(customerId: string): Promise<CustomerModel> {
    const existing = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });

    if (!existing.pfpMediaId) {
      return existing;
    }

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: { pfpMediaId: null },
    });

    await this.imageMediaService.delete(existing.pfpMediaId);

    return updated;
  }
}
