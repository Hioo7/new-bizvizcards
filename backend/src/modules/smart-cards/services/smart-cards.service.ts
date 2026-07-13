import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaService } from '../../../common/media/media.service';
import { SmartCardTemplateKey } from '../../../generated/prisma/client';
import {
  SMART_CARD_STORAGE_KEY_PREFIX,
  SMART_CARD_LIST_DEFAULT_PAGE,
  SMART_CARD_LIST_DEFAULT_PAGE_SIZE,
  SMART_CARD_PROFILE_LOGO_FIELD,
  SMART_CARD_FOUNDER_IMAGE_FIELD,
  smartCardServiceImageField,
  smartCardGalleryImageField,
} from '../smart-cards.constants';
import type { CreateSmartCardDto } from '../dto/create-smart-card.dto';
import type { UpdateSmartCardDto } from '../dto/update-smart-card.dto';
import type { ListSmartCardQueryDto } from '../dto/list-smart-card-query.dto';
import type {
  CreateImageSlotDto,
  UpdateImageSlotDto,
} from '../../../common/validators/image-slot.dto';

const FULL_INCLUDE = {
  profile: { include: { logoMedia: true } },
  contact: true,
  socialMedia: true,
  founder: { include: { image: true } },
  services: {
    orderBy: { order: 'asc' as const },
    include: { image: true },
  },
  testimonials: { orderBy: { order: 'asc' as const } },
  galleries: {
    orderBy: { order: 'asc' as const },
    include: {
      images: {
        orderBy: { order: 'asc' as const },
        include: { image: true },
      },
    },
  },
};

type FullSmartCard = NonNullable<
  Awaited<ReturnType<SmartCardsService['findScopedOrThrow']>>
>;

const PUBLIC_INCLUDE = {
  ...FULL_INCLUDE,
  template: { select: { key: true } },
};

@Injectable()
export class SmartCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async list(templateKey: SmartCardTemplateKey, query: ListSmartCardQueryDto) {
    const template = await this.resolveTemplate(templateKey);
    const page = query.page ?? SMART_CARD_LIST_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? SMART_CARD_LIST_DEFAULT_PAGE_SIZE;

    const where = {
      templateId: template.id,
      ...(query.customerId && { customerId: query.customerId }),
    };

    const [smartCards, total] = await Promise.all([
      this.prisma.smartCard.findMany({
        where,
        include: FULL_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.smartCard.count({ where }),
    ]);

    return {
      smartCards: smartCards.map((card) => this.toResponse(card)),
      total,
      page,
      pageSize,
    };
  }

  async getById(templateKey: SmartCardTemplateKey, id: string) {
    const card = await this.findScopedOrThrow(templateKey, id);
    return this.toResponse(card);
  }

  async getByEndpoint(endpoint: string) {
    const card = await this.prisma.smartCard.findUnique({
      where: { endpoint },
      include: PUBLIC_INCLUDE,
    });
    if (!card) {
      throw new NotFoundException('Smart card not found');
    }
    return { ...this.toResponse(card), templateKey: card.template.key };
  }

  async create(
    templateKey: SmartCardTemplateKey,
    actorAccountId: string,
    dto: CreateSmartCardDto,
    files: Express.Multer.File[],
  ) {
    const template = await this.resolveTemplate(templateKey);
    const fileMap = this.buildFileMap(files);

    // request.employeeSession.user.id is the EmployeeAccount id (better-auth's
    // own identity), not the Employee business-row id that createdByEmployeeId
    // actually references — resolve it the same way CustomersService resolves
    // a CustomerAccount id to its Customer business row.
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { accountId: actorAccountId },
    });

    const card = await this.createAnchor(
      template.id,
      dto.endpoint,
      dto.customerId,
      employee.id,
    );
    const keyPrefix = `${SMART_CARD_STORAGE_KEY_PREFIX}/${card.id}`;

    const logoMediaId = await this.resolveUploadSlot(
      dto.profile?.logo,
      SMART_CARD_PROFILE_LOGO_FIELD,
      fileMap,
      `${keyPrefix}/profile`,
    );
    const founderMediaId = await this.resolveUploadSlot(
      dto.founder?.image,
      SMART_CARD_FOUNDER_IMAGE_FIELD,
      fileMap,
      `${keyPrefix}/founder`,
    );
    const serviceMediaIds = await Promise.all(
      (dto.services ?? []).map((service, index) =>
        this.resolveUploadSlot(
          service.image,
          smartCardServiceImageField(index),
          fileMap,
          `${keyPrefix}/services/${index}`,
        ),
      ),
    );
    const galleryMediaIds = await Promise.all(
      (dto.galleries ?? []).map((gallery, g) =>
        Promise.all(
          gallery.images.map((_slot, j) =>
            this.resolveUploadSlot(
              gallery.images[j],
              smartCardGalleryImageField(g, j),
              fileMap,
              `${keyPrefix}/galleries/${g}`,
            ),
          ),
        ),
      ),
    );

    await this.prisma.$transaction(async (tx) => {
      if (dto.profile) {
        await tx.smartCardProfile.create({
          data: {
            smartCardId: card.id,
            companyName: dto.profile.companyName,
            tagline: dto.profile.tagline,
            subTagline: dto.profile.subTagline,
            aboutText: dto.profile.aboutText,
            logoMediaId,
          },
        });
      }
      if (dto.contact) {
        await tx.smartCardContact.create({
          data: { smartCardId: card.id, ...dto.contact },
        });
      }
      if (dto.socialMedia) {
        await tx.smartCardSocialMedia.create({
          data: { smartCardId: card.id, ...dto.socialMedia },
        });
      }
      if (dto.founder) {
        await tx.smartCardFounder.create({
          data: {
            smartCardId: card.id,
            name: dto.founder.name,
            title: dto.founder.title,
            experience: dto.founder.experience,
            projects: dto.founder.projects,
            satisfaction: dto.founder.satisfaction,
            introText: dto.founder.introText,
            philosophyText: dto.founder.philosophyText,
            quote: dto.founder.quote,
            imageMediaId: founderMediaId,
          },
        });
      }
      for (let i = 0; i < (dto.services ?? []).length; i++) {
        const service = dto.services[i];
        await tx.smartCardService.create({
          data: {
            smartCardId: card.id,
            title: service.title,
            description: service.description,
            imageMediaId: serviceMediaIds[i],
            order: i,
          },
        });
      }
      for (let i = 0; i < (dto.testimonials ?? []).length; i++) {
        await tx.smartCardTestimonial.create({
          data: { smartCardId: card.id, ...dto.testimonials[i], order: i },
        });
      }
      for (let g = 0; g < (dto.galleries ?? []).length; g++) {
        const galleryRow = await tx.smartCardGallery.create({
          data: {
            smartCardId: card.id,
            title: dto.galleries[g].title,
            order: g,
          },
        });
        for (let j = 0; j < dto.galleries[g].images.length; j++) {
          const mediaId = galleryMediaIds[g][j];
          if (!mediaId) {
            throw new BadRequestException(
              `Missing uploaded image for gallery ${g} image ${j}`,
            );
          }
          await tx.smartCardGalleryImage.create({
            data: { galleryId: galleryRow.id, imageMediaId: mediaId, order: j },
          });
        }
      }
    });

    return this.getById(templateKey, card.id);
  }

  async update(
    templateKey: SmartCardTemplateKey,
    id: string,
    dto: UpdateSmartCardDto,
    files: Express.Multer.File[],
  ) {
    const existing = await this.findScopedOrThrow(templateKey, id);
    const existingMediaIds = new Set(this.collectMediaIds(existing));
    const fileMap = this.buildFileMap(files);
    const keyPrefix = `${SMART_CARD_STORAGE_KEY_PREFIX}/${existing.id}`;

    if (dto.endpoint && dto.endpoint !== existing.endpoint) {
      await this.assertEndpointAvailable(dto.endpoint);
    }

    const logoMediaId = await this.resolveUpdateSlot(
      dto.profile?.logo,
      SMART_CARD_PROFILE_LOGO_FIELD,
      fileMap,
      `${keyPrefix}/profile`,
      existingMediaIds,
    );
    const founderMediaId = await this.resolveUpdateSlot(
      dto.founder?.image,
      SMART_CARD_FOUNDER_IMAGE_FIELD,
      fileMap,
      `${keyPrefix}/founder`,
      existingMediaIds,
    );
    const serviceMediaIds = await Promise.all(
      (dto.services ?? []).map((service, index) =>
        this.resolveUpdateSlot(
          service.image,
          smartCardServiceImageField(index),
          fileMap,
          `${keyPrefix}/services/${index}`,
          existingMediaIds,
        ),
      ),
    );
    const galleryMediaIds = await Promise.all(
      (dto.galleries ?? []).map((gallery, g) =>
        Promise.all(
          gallery.images.map((slot, j) =>
            this.resolveUpdateSlot(
              slot,
              smartCardGalleryImageField(g, j),
              fileMap,
              `${keyPrefix}/galleries/${g}`,
              existingMediaIds,
            ),
          ),
        ),
      ),
    );

    const newMediaIds = new Set(
      [
        logoMediaId,
        founderMediaId,
        ...serviceMediaIds,
        ...galleryMediaIds.flat(),
      ].filter((mediaId): mediaId is string => Boolean(mediaId)),
    );
    const orphanedMediaIds = [...existingMediaIds].filter(
      (mediaId) => !newMediaIds.has(mediaId),
    );

    await this.prisma.$transaction(async (tx) => {
      if (dto.endpoint && dto.endpoint !== existing.endpoint) {
        await tx.smartCard.update({
          where: { id: existing.id },
          data: { endpoint: dto.endpoint },
        });
      }
      if (dto.customerId !== undefined) {
        await tx.smartCard.update({
          where: { id: existing.id },
          data: { customerId: dto.customerId },
        });
      }

      if (dto.profile) {
        await tx.smartCardProfile.upsert({
          where: { smartCardId: existing.id },
          create: {
            smartCardId: existing.id,
            companyName: dto.profile.companyName,
            tagline: dto.profile.tagline,
            subTagline: dto.profile.subTagline,
            aboutText: dto.profile.aboutText,
            logoMediaId,
          },
          update: {
            companyName: dto.profile.companyName,
            tagline: dto.profile.tagline,
            subTagline: dto.profile.subTagline,
            aboutText: dto.profile.aboutText,
            logoMediaId,
          },
        });
      }
      if (dto.contact) {
        await tx.smartCardContact.upsert({
          where: { smartCardId: existing.id },
          create: { smartCardId: existing.id, ...dto.contact },
          update: { ...dto.contact },
        });
      }
      if (dto.socialMedia) {
        await tx.smartCardSocialMedia.upsert({
          where: { smartCardId: existing.id },
          create: { smartCardId: existing.id, ...dto.socialMedia },
          update: { ...dto.socialMedia },
        });
      }
      if (dto.founder) {
        const founderData = {
          name: dto.founder.name,
          title: dto.founder.title,
          experience: dto.founder.experience,
          projects: dto.founder.projects,
          satisfaction: dto.founder.satisfaction,
          introText: dto.founder.introText,
          philosophyText: dto.founder.philosophyText,
          quote: dto.founder.quote,
          imageMediaId: founderMediaId,
        };
        await tx.smartCardFounder.upsert({
          where: { smartCardId: existing.id },
          create: { smartCardId: existing.id, ...founderData },
          update: founderData,
        });
      }

      if (dto.services) {
        await tx.smartCardService.deleteMany({
          where: { smartCardId: existing.id },
        });
        for (let i = 0; i < dto.services.length; i++) {
          const service = dto.services[i];
          await tx.smartCardService.create({
            data: {
              smartCardId: existing.id,
              title: service.title,
              description: service.description,
              imageMediaId: serviceMediaIds[i],
              order: i,
            },
          });
        }
      }

      if (dto.testimonials) {
        await tx.smartCardTestimonial.deleteMany({
          where: { smartCardId: existing.id },
        });
        for (let i = 0; i < dto.testimonials.length; i++) {
          await tx.smartCardTestimonial.create({
            data: {
              smartCardId: existing.id,
              ...dto.testimonials[i],
              order: i,
            },
          });
        }
      }

      if (dto.galleries) {
        await tx.smartCardGallery.deleteMany({
          where: { smartCardId: existing.id },
        });
        for (let g = 0; g < dto.galleries.length; g++) {
          const galleryRow = await tx.smartCardGallery.create({
            data: {
              smartCardId: existing.id,
              title: dto.galleries[g].title,
              order: g,
            },
          });
          for (let j = 0; j < dto.galleries[g].images.length; j++) {
            const mediaId = galleryMediaIds[g][j];
            if (!mediaId) {
              throw new BadRequestException(
                `Missing image for gallery ${g} image ${j}`,
              );
            }
            await tx.smartCardGalleryImage.create({
              data: {
                galleryId: galleryRow.id,
                imageMediaId: mediaId,
                order: j,
              },
            });
          }
        }
      }
    });

    await Promise.allSettled(
      orphanedMediaIds.map((mediaId) => this.mediaService.delete(mediaId)),
    );

    return this.getById(templateKey, existing.id);
  }

  async remove(templateKey: SmartCardTemplateKey, id: string) {
    const existing = await this.findScopedOrThrow(templateKey, id);
    const mediaIds = this.collectMediaIds(existing);

    await this.prisma.smartCard.delete({ where: { id: existing.id } });
    await Promise.allSettled(
      mediaIds.map((mediaId) => this.mediaService.delete(mediaId)),
    );

    return { success: true };
  }

  // ── internal helpers ──────────────────────────────────────────────────────

  private async resolveTemplate(key: SmartCardTemplateKey) {
    return this.prisma.smartCardTemplate.findUniqueOrThrow({ where: { key } });
  }

  private async findScopedOrThrow(
    templateKey: SmartCardTemplateKey,
    id: string,
  ) {
    const template = await this.resolveTemplate(templateKey);
    const card = await this.prisma.smartCard.findFirst({
      where: { id, templateId: template.id },
      include: FULL_INCLUDE,
    });
    if (!card) {
      throw new NotFoundException('Smart card not found');
    }
    return card;
  }

  private async createAnchor(
    templateId: string,
    endpoint: string,
    customerId: string | undefined,
    createdByEmployeeId: string,
  ) {
    await this.assertEndpointAvailable(endpoint);

    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        throw new BadRequestException(
          'customerId does not reference an existing customer',
        );
      }
    }

    return this.prisma.smartCard.create({
      data: { templateId, endpoint, customerId, createdByEmployeeId },
    });
  }

  private async assertEndpointAvailable(endpoint: string): Promise<void> {
    const existing = await this.prisma.smartCard.findUnique({
      where: { endpoint },
    });
    if (existing) {
      throw new ConflictException('Endpoint already in use');
    }
  }

  private buildFileMap(
    files: Express.Multer.File[],
  ): Map<string, Express.Multer.File> {
    const map = new Map<string, Express.Multer.File>();
    for (const file of files) {
      map.set(file.fieldname, file);
    }
    return map;
  }

  private async uploadFile(
    fieldName: string,
    fileMap: Map<string, Express.Multer.File>,
    keyPrefix: string,
  ): Promise<string> {
    const file = fileMap.get(fieldName);
    if (!file) {
      throw new BadRequestException(
        `Missing uploaded file for field "${fieldName}"`,
      );
    }
    const media = await this.mediaService.upload({
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      extension: this.extensionFromFilename(file.originalname),
      keyPrefix,
    });
    return media.id;
  }

  private extensionFromFilename(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  private async resolveUploadSlot(
    slot: CreateImageSlotDto | undefined,
    fieldName: string,
    fileMap: Map<string, Express.Multer.File>,
    keyPrefix: string,
  ): Promise<string | undefined> {
    if (!slot) return undefined;
    return this.uploadFile(fieldName, fileMap, keyPrefix);
  }

  private async resolveUpdateSlot(
    slot: UpdateImageSlotDto | undefined,
    fieldName: string,
    fileMap: Map<string, Express.Multer.File>,
    keyPrefix: string,
    existingMediaIds: Set<string>,
  ): Promise<string | undefined> {
    if (!slot) return undefined;
    if (slot.action === 'keep') {
      if (!existingMediaIds.has(slot.mediaId)) {
        throw new BadRequestException(
          'mediaId does not belong to this smart card',
        );
      }
      return slot.mediaId;
    }
    return this.uploadFile(fieldName, fileMap, keyPrefix);
  }

  private collectMediaIds(card: FullSmartCard): string[] {
    const ids: (string | null | undefined)[] = [
      card.profile?.logoMediaId,
      card.founder?.imageMediaId,
      ...card.services.map((service) => service.imageMediaId),
      ...card.galleries.flatMap((gallery) =>
        gallery.images.map((image) => image.imageMediaId),
      ),
    ];
    return ids.filter((id): id is string => Boolean(id));
  }

  private toResponse(card: FullSmartCard) {
    return {
      id: card.id,
      endpoint: card.endpoint,
      customerId: card.customerId,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      profile: card.profile
        ? {
            companyName: card.profile.companyName,
            tagline: card.profile.tagline,
            subTagline: card.profile.subTagline,
            aboutText: card.profile.aboutText,
            logoMediaId: card.profile.logoMediaId,
            logoUrl: card.profile.logoMedia
              ? this.mediaService.getPublicUrl(card.profile.logoMedia)
              : null,
          }
        : null,
      contact: card.contact
        ? {
            contactNumber: card.contact.contactNumber,
            email: card.contact.email,
            address: card.contact.address,
          }
        : null,
      socialMedia: card.socialMedia
        ? {
            whatsapp: card.socialMedia.whatsapp,
            instagram: card.socialMedia.instagram,
            facebook: card.socialMedia.facebook,
            linkedIn: card.socialMedia.linkedIn,
            twitter: card.socialMedia.twitter,
            youtube: card.socialMedia.youtube,
            googleMap: card.socialMedia.googleMap,
            website: card.socialMedia.website,
            other: card.socialMedia.other,
          }
        : null,
      founder: card.founder
        ? {
            name: card.founder.name,
            title: card.founder.title,
            experience: card.founder.experience,
            projects: card.founder.projects,
            satisfaction: card.founder.satisfaction,
            introText: card.founder.introText,
            philosophyText: card.founder.philosophyText,
            quote: card.founder.quote,
            imageMediaId: card.founder.imageMediaId,
            imageUrl: card.founder.image
              ? this.mediaService.getPublicUrl(card.founder.image)
              : null,
          }
        : null,
      services: card.services.map((service) => ({
        title: service.title,
        description: service.description,
        imageMediaId: service.imageMediaId,
        imageUrl: service.image
          ? this.mediaService.getPublicUrl(service.image)
          : null,
      })),
      testimonials: card.testimonials.map((testimonial) => ({
        name: testimonial.name,
        initials: testimonial.initials,
        text: testimonial.text,
      })),
      galleries: card.galleries.map((gallery) => ({
        title: gallery.title,
        images: gallery.images.map((image) => ({
          imageMediaId: image.imageMediaId,
          imageUrl: this.mediaService.getPublicUrl(image.image),
        })),
      })),
    };
  }
}

export type PublicSmartCard = Awaited<
  ReturnType<SmartCardsService['getByEndpoint']>
>;
