import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ImageMediaService } from '../../../common/media/image-media.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ECardComponentType } from '../../../generated/prisma/client';
import type {
  CreateImageSlotDto,
  UpdateImageSlotDto,
} from '../../../common/validators/image-slot.dto';
import type {
  CreateEcardAsEmployeeDto,
  CreateEcardDto,
  EcardComponentInputDto,
} from '../dto/create-ecard.dto';
import type { ListEcardQueryDto } from '../dto/list-ecard-query.dto';
import type {
  UpdateEcardComponentInputDto,
  UpdateEcardDto,
} from '../dto/update-ecard.dto';
import {
  ECARD_HERO_PHOTO_FIELD,
  ECARD_LIST_DEFAULT_PAGE,
  ECARD_LIST_DEFAULT_PAGE_SIZE,
  ECARD_STORAGE_KEY_PREFIX,
  ecardGalleryImageField,
} from '../ecards.constants';

const FULL_INCLUDE = {
  customer: { include: { account: { select: { name: true, email: true } } } },
  heroProfilePhoto: true,
  components: {
    orderBy: { order: 'asc' as const },
    include: {
      about: true,
      socialLinks: true,
      video: true,
      whatsapp: true,
      gallery: {
        include: {
          subGalleries: {
            orderBy: { order: 'asc' as const },
            include: {
              images: {
                orderBy: { order: 'asc' as const },
                include: { image: true },
              },
            },
          },
        },
      },
      team: {
        include: {
          members: {
            orderBy: { order: 'asc' as const },
            include: {
              organisationMember: {
                include: {
                  customer: {
                    include: {
                      account: { select: { name: true, email: true } },
                      pfpMedia: true,
                      ecard: {
                        select: {
                          endpoint: true,
                          phoneCountryDialCode: true,
                          phoneNumber: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

type FullEcard = NonNullable<
  Awaited<ReturnType<EcardsService['findByIdOrThrow']>>
>;
type FullEcardComponent = FullEcard['components'][number];
type FullTeamMember = NonNullable<
  FullEcardComponent['team']
>['members'][number];

export interface EcardComponentResponseBase {
  id: string;
  order: number;
}

export interface EcardAboutComponentResponse extends EcardComponentResponseBase {
  type: typeof ECardComponentType.ABOUT;
  profession: string | null;
  shortNote: string | null;
  description: string | null;
  aboutMe: string | null;
}

export interface EcardSocialLinksComponentResponse extends EcardComponentResponseBase {
  type: typeof ECardComponentType.SOCIAL_LINKS;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedIn: string | null;
}

export interface EcardVideoComponentResponse extends EcardComponentResponseBase {
  type: typeof ECardComponentType.VIDEO;
  title: string | null;
  videoUrl: string | null;
}

export interface EcardGalleryImageResponse {
  imageMediaId: string;
  imageUrl: string;
}

export interface EcardSubGalleryResponse {
  id: string;
  title: string | null;
  images: EcardGalleryImageResponse[];
}

export interface EcardGalleryComponentResponse extends EcardComponentResponseBase {
  type: typeof ECardComponentType.GALLERY;
  subGalleries: EcardSubGalleryResponse[];
}

export interface EcardTeamMemberResponse {
  organisationMemberId: string;
  name: string;
  email: string;
  photoUrl: string | null;
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
  ecardEndpoint: string | null;
}

export interface EcardTeamComponentResponse extends EcardComponentResponseBase {
  type: typeof ECardComponentType.TEAM;
  title: string | null;
  members: EcardTeamMemberResponse[];
}

export interface EcardWhatsAppComponentResponse extends EcardComponentResponseBase {
  type: typeof ECardComponentType.WHATSAPP;
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
}

export type EcardComponentResponse =
  | EcardAboutComponentResponse
  | EcardSocialLinksComponentResponse
  | EcardVideoComponentResponse
  | EcardGalleryComponentResponse
  | EcardTeamComponentResponse
  | EcardWhatsAppComponentResponse;

@Injectable()
export class EcardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageMediaService: ImageMediaService,
  ) {}

  async getByCustomerId(customerId: string) {
    const card = await this.prisma.eCard.findUnique({
      where: { customerId },
      include: FULL_INCLUDE,
    });
    return card ? this.toResponse(card) : null;
  }

  async getById(id: string) {
    const card = await this.findByIdOrThrow(id);
    return this.toResponse(card);
  }

  async getByEndpoint(endpoint: string) {
    const card = await this.prisma.eCard.findUnique({
      where: { endpoint },
      include: FULL_INCLUDE,
    });
    if (!card) {
      throw new NotFoundException('E-card not found');
    }
    return this.toResponse(card);
  }

  async list(query: ListEcardQueryDto) {
    const page = query.page ?? ECARD_LIST_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? ECARD_LIST_DEFAULT_PAGE_SIZE;
    const where = {
      ...(query.customerId && { customerId: query.customerId }),
    };

    const [ecards, total] = await Promise.all([
      this.prisma.eCard.findMany({
        where,
        include: FULL_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.eCard.count({ where }),
    ]);

    return {
      ecards: ecards.map((card) => this.toResponse(card)),
      total,
      page,
      pageSize,
    };
  }

  async createForCustomer(
    customerId: string,
    dto: CreateEcardDto,
    files: Express.Multer.File[],
  ) {
    return this.create(customerId, dto, files, null);
  }

  async createAsEmployee(
    actorAccountId: string,
    dto: CreateEcardAsEmployeeDto,
    files: Express.Multer.File[],
  ) {
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { accountId: actorAccountId },
    });
    const { customerId, ...rest } = dto;
    await this.assertCustomerExists(customerId);
    return this.create(customerId, rest, files, employee.id);
  }

  async updateByCustomerId(
    customerId: string,
    dto: UpdateEcardDto,
    files: Express.Multer.File[],
  ) {
    const existing = await this.prisma.eCard.findUnique({
      where: { customerId },
      include: FULL_INCLUDE,
    });
    if (!existing) {
      throw new NotFoundException('E-card not found');
    }
    return this.update(existing, dto, files);
  }

  async updateById(
    id: string,
    dto: UpdateEcardDto,
    files: Express.Multer.File[],
  ) {
    const existing = await this.findByIdOrThrow(id);
    return this.update(existing, dto, files);
  }

  async removeByCustomerId(customerId: string): Promise<void> {
    const existing = await this.prisma.eCard.findUnique({
      where: { customerId },
      include: FULL_INCLUDE,
    });
    if (!existing) {
      throw new NotFoundException('E-card not found');
    }
    await this.remove(existing);
  }

  async removeById(id: string): Promise<void> {
    const existing = await this.findByIdOrThrow(id);
    await this.remove(existing);
  }

  // ── shared create/update/remove ─────────────────────────────────────────

  private async create(
    customerId: string,
    dto: CreateEcardDto,
    files: Express.Multer.File[],
    createdByEmployeeId: string | null,
  ) {
    await this.assertCustomerHasNoEcard(customerId);
    await this.assertEndpointAvailable(dto.endpoint);

    const teamComponent = dto.components.find(
      (component) => component.type === 'TEAM',
    );
    if (teamComponent) {
      await this.assertTeamMembersBelongToOwnerOrganisation(
        customerId,
        teamComponent.members.map((member) => member.organisationMemberId),
      );
    }

    const card = await this.prisma.eCard.create({
      data: {
        customerId,
        endpoint: dto.endpoint,
        createdByEmployeeId,
        heroCompanyName: dto.heroCompanyName,
        phoneCountryDialCode: dto.phoneCountryDialCode,
        phoneNumber: dto.phoneNumber,
        isExchangeContactEnabled: dto.isExchangeContactEnabled,
      },
    });
    const keyPrefix = `${ECARD_STORAGE_KEY_PREFIX}/${card.id}`;
    const fileMap = this.buildFileMap(files);

    const heroMediaId = await this.resolveUploadSlot(
      dto.heroProfilePhoto,
      ECARD_HERO_PHOTO_FIELD,
      fileMap,
      `${keyPrefix}/hero`,
    );
    const galleryMediaIds = await this.resolveCreateGalleryUploads(
      dto.components,
      fileMap,
      keyPrefix,
    );

    await this.prisma.$transaction(async (tx) => {
      if (heroMediaId) {
        await tx.eCard.update({
          where: { id: card.id },
          data: { heroProfilePhotoMediaId: heroMediaId },
        });
      }

      for (let i = 0; i < dto.components.length; i++) {
        const component = dto.components[i];
        const componentRow = await tx.eCardComponent.create({
          data: {
            ecardId: card.id,
            type: ECardComponentType[component.type],
            order: i,
          },
        });
        await this.createComponentSatellite(
          tx,
          componentRow.id,
          component,
          galleryMediaIds,
        );
      }
    });

    return this.getById(card.id);
  }

  private async update(
    existing: FullEcard,
    dto: UpdateEcardDto,
    files: Express.Multer.File[],
  ) {
    const existingMediaIds = new Set(this.collectMediaIds(existing));
    const keyPrefix = `${ECARD_STORAGE_KEY_PREFIX}/${existing.id}`;
    const fileMap = this.buildFileMap(files);

    if (dto.endpoint !== existing.endpoint) {
      await this.assertEndpointAvailable(dto.endpoint);
    }

    const teamComponent = dto.components.find(
      (component) => component.type === 'TEAM',
    );
    if (teamComponent) {
      await this.assertTeamMembersBelongToOwnerOrganisation(
        existing.customerId,
        teamComponent.members.map((member) => member.organisationMemberId),
      );
    }

    const heroMediaId = await this.resolveUpdateSlot(
      dto.heroProfilePhoto,
      ECARD_HERO_PHOTO_FIELD,
      fileMap,
      `${keyPrefix}/hero`,
      existingMediaIds,
    );
    const galleryMediaIds = await this.resolveUpdateGalleryUploads(
      dto.components,
      fileMap,
      keyPrefix,
      existingMediaIds,
    );

    const newMediaIds = new Set(
      [heroMediaId, ...galleryMediaIds.flat()].filter(
        (mediaId): mediaId is string => Boolean(mediaId),
      ),
    );
    const orphanedMediaIds = [...existingMediaIds].filter(
      (mediaId) => !newMediaIds.has(mediaId),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.eCard.update({
        where: { id: existing.id },
        data: {
          endpoint: dto.endpoint,
          heroCompanyName: dto.heroCompanyName,
          phoneCountryDialCode: dto.phoneCountryDialCode,
          phoneNumber: dto.phoneNumber,
          isExchangeContactEnabled: dto.isExchangeContactEnabled,
          heroProfilePhotoMediaId: heroMediaId ?? null,
        },
      });

      await tx.eCardComponent.deleteMany({
        where: { ecardId: existing.id },
      });

      for (let i = 0; i < dto.components.length; i++) {
        const component = dto.components[i];
        const componentRow = await tx.eCardComponent.create({
          data: {
            ecardId: existing.id,
            type: ECardComponentType[component.type],
            order: i,
          },
        });
        await this.createComponentSatellite(
          tx,
          componentRow.id,
          component,
          galleryMediaIds,
        );
      }
    });

    await Promise.allSettled(
      orphanedMediaIds.map((mediaId) => this.imageMediaService.delete(mediaId)),
    );

    return this.getById(existing.id);
  }

  private async remove(existing: FullEcard): Promise<void> {
    const mediaIds = this.collectMediaIds(existing);
    await this.prisma.eCard.delete({ where: { id: existing.id } });
    await Promise.allSettled(
      mediaIds.map((mediaId) => this.imageMediaService.delete(mediaId)),
    );
  }

  // ── component satellite writes ──────────────────────────────────────────

  private async createComponentSatellite(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    ecardComponentId: string,
    component: EcardComponentInputDto | UpdateEcardComponentInputDto,
    galleryMediaIds: (string | undefined)[][],
  ): Promise<void> {
    switch (component.type) {
      case 'ABOUT':
        await tx.eCardAboutComponent.create({
          data: {
            ecardComponentId,
            profession: component.profession,
            shortNote: component.shortNote,
            description: component.description,
            aboutMe: component.aboutMe,
          },
        });
        return;
      case 'SOCIAL_LINKS':
        await tx.eCardSocialLinksComponent.create({
          data: {
            ecardComponentId,
            website: component.website,
            instagram: component.instagram,
            facebook: component.facebook,
            twitter: component.twitter,
            linkedIn: component.linkedIn,
          },
        });
        return;
      case 'WHATSAPP':
        await tx.eCardWhatsAppComponent.create({
          data: {
            ecardComponentId,
            phoneCountryDialCode: component.phoneCountryDialCode,
            phoneNumber: component.phoneNumber,
          },
        });
        return;
      case 'VIDEO':
        await tx.eCardVideoComponent.create({
          data: {
            ecardComponentId,
            title: component.title,
            videoUrl: component.videoUrl,
          },
        });
        return;
      case 'GALLERY': {
        const galleryRow = await tx.eCardGalleryComponent.create({
          data: { ecardComponentId },
        });
        for (let g = 0; g < component.subGalleries.length; g++) {
          const subGallery = component.subGalleries[g];
          const subGalleryRow = await tx.eCardSubGallery.create({
            data: {
              galleryComponentId: galleryRow.ecardComponentId,
              title: subGallery.title,
              order: g,
            },
          });
          for (let j = 0; j < subGallery.images.length; j++) {
            const mediaId = galleryMediaIds[g]?.[j];
            if (!mediaId) {
              throw new BadRequestException(
                `Missing uploaded image for gallery ${g} image ${j}`,
              );
            }
            await tx.eCardGalleryImage.create({
              data: {
                subGalleryId: subGalleryRow.id,
                imageMediaId: mediaId,
                order: j,
              },
            });
          }
        }
        return;
      }
      case 'TEAM': {
        const teamRow = await tx.eCardTeamComponent.create({
          data: { ecardComponentId, title: component.title },
        });
        for (let m = 0; m < component.members.length; m++) {
          await tx.eCardTeamMember.create({
            data: {
              teamComponentId: teamRow.ecardComponentId,
              organisationMemberId: component.members[m].organisationMemberId,
              order: m,
            },
          });
        }
        return;
      }
    }
  }

  // ── media upload resolution ─────────────────────────────────────────────

  private async resolveCreateGalleryUploads(
    components: EcardComponentInputDto[],
    fileMap: Map<string, Express.Multer.File>,
    keyPrefix: string,
  ): Promise<(string | undefined)[][]> {
    const galleryComponent = components.find(
      (component) => component.type === 'GALLERY',
    );
    if (!galleryComponent || galleryComponent.type !== 'GALLERY') {
      return [];
    }
    return Promise.all(
      galleryComponent.subGalleries.map((subGallery, g) =>
        Promise.all(
          subGallery.images.map((slot, j) =>
            this.resolveUploadSlot(
              slot,
              ecardGalleryImageField(g, j),
              fileMap,
              `${keyPrefix}/gallery/${g}`,
            ),
          ),
        ),
      ),
    );
  }

  private async resolveUpdateGalleryUploads(
    components: UpdateEcardComponentInputDto[],
    fileMap: Map<string, Express.Multer.File>,
    keyPrefix: string,
    existingMediaIds: Set<string>,
  ): Promise<(string | undefined)[][]> {
    const galleryComponent = components.find(
      (component) => component.type === 'GALLERY',
    );
    if (!galleryComponent || galleryComponent.type !== 'GALLERY') {
      return [];
    }
    return Promise.all(
      galleryComponent.subGalleries.map((subGallery, g) =>
        Promise.all(
          subGallery.images.map((slot, j) =>
            this.resolveUpdateSlot(
              slot,
              ecardGalleryImageField(g, j),
              fileMap,
              `${keyPrefix}/gallery/${g}`,
              existingMediaIds,
            ),
          ),
        ),
      ),
    );
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
    const media = await this.imageMediaService.upload({
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
        throw new BadRequestException('mediaId does not belong to this e-card');
      }
      return slot.mediaId;
    }
    return this.uploadFile(fieldName, fileMap, keyPrefix);
  }

  // ── assertions ───────────────────────────────────────────────────────────

  private async assertCustomerHasNoEcard(customerId: string): Promise<void> {
    const existing = await this.prisma.eCard.findUnique({
      where: { customerId },
    });
    if (existing) {
      throw new ConflictException('This customer already has an e-card');
    }
  }

  private async assertCustomerExists(customerId: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new BadRequestException(
        'customerId does not reference an existing customer',
      );
    }
  }

  private async assertEndpointAvailable(endpoint: string): Promise<void> {
    const existing = await this.prisma.eCard.findUnique({
      where: { endpoint },
    });
    if (existing) {
      throw new ConflictException('Endpoint already in use');
    }
  }

  private async assertTeamMembersBelongToOwnerOrganisation(
    customerId: string,
    organisationMemberIds: string[],
  ): Promise<void> {
    if (organisationMemberIds.length === 0) {
      return;
    }
    const ownerMembership = await this.prisma.organisationMember.findUnique({
      where: { customerId },
    });
    if (!ownerMembership) {
      throw new BadRequestException(
        'Cannot add team members: this customer does not belong to an organisation',
      );
    }
    const uniqueIds = new Set(organisationMemberIds);
    const validCount = await this.prisma.organisationMember.count({
      where: {
        id: { in: [...uniqueIds] },
        organisationId: ownerMembership.organisationId,
      },
    });
    if (validCount !== uniqueIds.size) {
      throw new BadRequestException(
        'One or more team members do not belong to your organisation',
      );
    }
  }

  // ── read helpers ─────────────────────────────────────────────────────────

  private async findByIdOrThrow(id: string) {
    const card = await this.prisma.eCard.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    if (!card) {
      throw new NotFoundException('E-card not found');
    }
    return card;
  }

  private collectMediaIds(card: FullEcard): string[] {
    const ids: (string | null | undefined)[] = [
      card.heroProfilePhotoMediaId,
      ...card.components.flatMap(
        (component) =>
          component.gallery?.subGalleries.flatMap((subGallery) =>
            subGallery.images.map((image) => image.imageMediaId),
          ) ?? [],
      ),
    ];
    return ids.filter((id): id is string => Boolean(id));
  }

  private toResponse(card: FullEcard) {
    return {
      id: card.id,
      endpoint: card.endpoint,
      customerId: card.customerId,
      createdByEmployeeId: card.createdByEmployeeId,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      hero: {
        name: card.customer.account.name,
        email: card.customer.account.email,
        companyName: card.heroCompanyName,
        profilePhotoMediaId: card.heroProfilePhotoMediaId,
        profilePhotoUrl: card.heroProfilePhoto
          ? this.imageMediaService.getPublicUrl(card.heroProfilePhoto)
          : null,
        phoneCountryDialCode: card.phoneCountryDialCode,
        phoneNumber: card.phoneNumber,
        isExchangeContactEnabled: card.isExchangeContactEnabled,
      },
      components: card.components.map((component) =>
        this.componentToResponse(component),
      ),
    };
  }

  private componentToResponse(
    component: FullEcardComponent,
  ): EcardComponentResponse {
    const base: EcardComponentResponseBase = {
      id: component.id,
      order: component.order,
    };

    switch (component.type) {
      case ECardComponentType.ABOUT:
        return {
          ...base,
          type: ECardComponentType.ABOUT,
          profession: component.about?.profession ?? null,
          shortNote: component.about?.shortNote ?? null,
          description: component.about?.description ?? null,
          aboutMe: component.about?.aboutMe ?? null,
        };
      case ECardComponentType.SOCIAL_LINKS:
        return {
          ...base,
          type: ECardComponentType.SOCIAL_LINKS,
          website: component.socialLinks?.website ?? null,
          instagram: component.socialLinks?.instagram ?? null,
          facebook: component.socialLinks?.facebook ?? null,
          twitter: component.socialLinks?.twitter ?? null,
          linkedIn: component.socialLinks?.linkedIn ?? null,
        };
      case ECardComponentType.WHATSAPP:
        return {
          ...base,
          type: ECardComponentType.WHATSAPP,
          phoneCountryDialCode:
            component.whatsapp?.phoneCountryDialCode ?? null,
          phoneNumber: component.whatsapp?.phoneNumber ?? null,
        };
      case ECardComponentType.VIDEO:
        return {
          ...base,
          type: ECardComponentType.VIDEO,
          title: component.video?.title ?? null,
          videoUrl: component.video?.videoUrl ?? null,
        };
      case ECardComponentType.GALLERY:
        return {
          ...base,
          type: ECardComponentType.GALLERY,
          subGalleries: (component.gallery?.subGalleries ?? []).map(
            (subGallery) => ({
              id: subGallery.id,
              title: subGallery.title,
              images: subGallery.images.map((image) => ({
                imageMediaId: image.imageMediaId,
                imageUrl: this.imageMediaService.getPublicUrl(image.image),
              })),
            }),
          ),
        };
      case ECardComponentType.TEAM:
        return {
          ...base,
          type: ECardComponentType.TEAM,
          title: component.team?.title ?? null,
          members: (component.team?.members ?? []).map((member) =>
            this.teamMemberToResponse(member),
          ),
        };
    }
  }

  private teamMemberToResponse(
    member: FullTeamMember,
  ): EcardTeamMemberResponse {
    const customer = member.organisationMember.customer;
    return {
      organisationMemberId: member.organisationMemberId,
      name: customer.account.name,
      email: customer.account.email,
      photoUrl: customer.pfpMedia
        ? this.imageMediaService.getPublicUrl(customer.pfpMedia)
        : null,
      phoneCountryDialCode: customer.ecard?.phoneCountryDialCode ?? null,
      phoneNumber: customer.ecard?.phoneNumber ?? null,
      ecardEndpoint: customer.ecard?.endpoint ?? null,
    };
  }
}

export type PublicEcard = Awaited<ReturnType<EcardsService['getByEndpoint']>>;
