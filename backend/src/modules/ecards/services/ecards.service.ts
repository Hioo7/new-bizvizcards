import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaSlotResolverService } from '../../../common/media/media-slot-resolver.service';
import { MediaService } from '../../../common/media/media.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ECardComponentType } from '../../../generated/prisma/client';
import { OrganisationMembersService } from '../../organisations/services/organisation-members.service';
import { OrganisationsService } from '../../organisations/services/organisations.service';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import type { CreateEcardAsSpocDto } from '../dto/create-ecard-as-spoc.dto';
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
  ECARD_BROCHURE_FIELD,
  ECARD_HERO_PHOTO_FIELD,
  ECARD_LIST_DEFAULT_PAGE,
  ECARD_LIST_DEFAULT_PAGE_SIZE,
  ECARD_MAX_PER_CUSTOMER,
  ECARD_STORAGE_KEY_PREFIX,
  ecardGalleryImageField,
} from '../ecards.constants';

const FULL_INCLUDE = {
  customer: {
    include: {
      account: { select: { name: true, email: true } },
    },
  },
  heroProfilePhoto: true,
  components: {
    orderBy: { order: 'asc' as const },
    include: {
      about: true,
      socialLinks: true,
      video: true,
      whatsapp: true,
      brochure: { include: { pdf: true } },
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
                      // Every card this teammate owns — the org-tagged one
                      // (if any) is picked out at read time in
                      // teamMemberToResponse, since a customer can now own
                      // more than one.
                      ecards: {
                        select: {
                          endpoint: true,
                          phoneCountryDialCode: true,
                          phoneNumber: true,
                          organisationId: true,
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

export interface EcardBrochureComponentResponse extends EcardComponentResponseBase {
  type: typeof ECardComponentType.BROCHURE;
  pdfMediaId: string | null;
  pdfUrl: string | null;
  fileName: string | null;
}

export type EcardComponentResponse =
  | EcardAboutComponentResponse
  | EcardSocialLinksComponentResponse
  | EcardVideoComponentResponse
  | EcardGalleryComponentResponse
  | EcardTeamComponentResponse
  | EcardWhatsAppComponentResponse
  | EcardBrochureComponentResponse;

@Injectable()
export class EcardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly mediaSlotResolver: MediaSlotResolverService,
    private readonly organisationsService: OrganisationsService,
    private readonly organisationMembersService: OrganisationMembersService,
    private readonly planEnforcementService: PlanEnforcementService,
  ) {}

  async listByCustomerId(customerId: string) {
    const cards = await this.prisma.eCard.findMany({
      where: { customerId },
      include: FULL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return cards.map((card) => this.toResponse(card));
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
      ...(query.organisationId && { organisationId: query.organisationId }),
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

  async updateById(
    id: string,
    dto: UpdateEcardDto,
    files: Express.Multer.File[],
  ) {
    const existing = await this.findByIdOrThrow(id);
    return this.update(existing, dto, files);
  }

  async removeById(id: string): Promise<void> {
    const existing = await this.findByIdOrThrow(id);
    await this.remove(existing);
  }

  // ── SPOC-initiated (organisation-scoped) operations ─────────────────────

  async createForOrganisationSpoc(
    actorCustomerId: string,
    organisationId: string,
    dto: CreateEcardAsSpocDto,
    files: Express.Multer.File[],
  ) {
    await this.organisationsService.assertIsSpoc(
      actorCustomerId,
      organisationId,
    );
    const { memberId, ...rest } = dto;
    const member =
      await this.organisationMembersService.getMemberInOrganisationOrThrow(
        memberId,
        organisationId,
      );
    return this.create(
      member.customerId,
      { ...rest, organisationId },
      files,
      null,
    );
  }

  async updateForOrganisationSpoc(
    actorCustomerId: string,
    organisationId: string,
    ecardId: string,
    dto: UpdateEcardDto,
    files: Express.Multer.File[],
  ) {
    await this.organisationsService.assertIsSpoc(
      actorCustomerId,
      organisationId,
    );
    const existing = await this.findByIdOrThrow(ecardId);
    if (existing.organisationId !== organisationId) {
      throw new NotFoundException('E-card not found');
    }
    // Never trust a body-supplied organisationId here — force it to stay on
    // the org the SPOC is authorized for, so this endpoint can't be used to
    // relink a card to a different organisation.
    return this.update(existing, { ...dto, organisationId }, files);
  }

  async getForOrganisationSpoc(
    actorCustomerId: string,
    organisationId: string,
    ecardId: string,
  ) {
    await this.organisationsService.assertIsSpoc(
      actorCustomerId,
      organisationId,
    );
    const card = await this.getById(ecardId);
    if (card.organisationId !== organisationId) {
      throw new NotFoundException('E-card not found');
    }
    return card;
  }

  async listForOrganisationSpoc(
    actorCustomerId: string,
    organisationId: string,
    query: ListEcardQueryDto,
  ) {
    await this.organisationsService.assertIsSpoc(
      actorCustomerId,
      organisationId,
    );
    return this.list({ ...query, organisationId });
  }

  // ── Employee-initiated organisation-member e-card linking ────────────────

  /**
   * Sets which of a member's e-cards is linked to their organisation.
   * Atomically unlinks any other card that customer currently has linked to
   * the same org (only one is allowed per customer per org, enforced by
   * @@unique([customerId, organisationId]) on ECard) before linking the
   * chosen one, so the caller never has to unlink first — this is what lets
   * the admin UI treat it as a single "switch" action.
   */
  async linkEcardForEmployee(
    organisationId: string,
    memberId: string,
    ecardId: string,
  ) {
    const member =
      await this.organisationMembersService.getMemberInOrganisationOrThrow(
        memberId,
        organisationId,
      );
    const ecard = await this.findByIdOrThrow(ecardId);
    if (ecard.customerId !== member.customerId) {
      throw new ForbiddenException(
        'This e-card does not belong to the selected member',
      );
    }

    await this.prisma.$transaction([
      this.prisma.eCard.updateMany({
        where: {
          customerId: member.customerId,
          organisationId,
          id: { not: ecardId },
        },
        data: { organisationId: null },
      }),
      this.prisma.eCard.update({
        where: { id: ecardId },
        data: { organisationId },
      }),
    ]);

    return this.getById(ecardId);
  }

  // ── shared create/update/remove ─────────────────────────────────────────

  private async create(
    customerId: string,
    dto: CreateEcardDto,
    files: Express.Multer.File[],
    createdByEmployeeId: string | null,
  ) {
    await this.assertUnderEcardCap(customerId);
    await this.planEnforcementService.assertCanCreateEcard(customerId);
    await this.assertEndpointAvailable(dto.endpoint);
    if (dto.organisationId) {
      await this.assertOrganisationExists(dto.organisationId);
      await this.assertCustomerBelongsToOrganisation(
        customerId,
        dto.organisationId,
      );
      await this.assertCustomerHasNoEcardForOrganisation(
        customerId,
        dto.organisationId,
      );
    }

    const teamComponent = dto.components.find(
      (component) => component.type === 'TEAM',
    );
    if (teamComponent) {
      await this.assertTeamMembersBelongToOwnerOrganisation(
        dto.organisationId ?? null,
        teamComponent.members.map((member) => member.organisationMemberId),
      );
    }

    const galleryComponent = dto.components.find(
      (component) => component.type === 'GALLERY',
    );
    await this.planEnforcementService.assertCanAddGalleryContent(
      customerId,
      null,
      galleryComponent
        ? { subGalleries: galleryComponent.subGalleries }
        : undefined,
    );

    const card = await this.prisma.eCard.create({
      data: {
        customerId,
        endpoint: dto.endpoint,
        createdByEmployeeId,
        organisationId: dto.organisationId,
        heroName: dto.heroName,
        heroEmail: dto.heroEmail,
        heroCompanyName: dto.heroCompanyName,
        phoneCountryDialCode: dto.phoneCountryDialCode,
        phoneNumber: dto.phoneNumber,
        isExchangeContactEnabled: dto.isExchangeContactEnabled,
        autoDownloadContact: dto.autoDownloadContact,
      },
    });
    const keyPrefix = `${ECARD_STORAGE_KEY_PREFIX}/${card.id}`;
    const fileMap = this.mediaSlotResolver.buildFileMap(files);

    const heroMediaId = await this.mediaSlotResolver.resolveUploadSlot(
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
    const brochureComponent = dto.components.find(
      (component) => component.type === 'BROCHURE',
    );
    const brochureMediaId = await this.mediaSlotResolver.resolveUploadSlot(
      brochureComponent?.pdf,
      ECARD_BROCHURE_FIELD,
      fileMap,
      `${keyPrefix}/brochure`,
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
          brochureMediaId,
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
    const fileMap = this.mediaSlotResolver.buildFileMap(files);

    if (dto.endpoint !== existing.endpoint) {
      await this.assertEndpointAvailable(dto.endpoint);
    }
    if (dto.organisationId && dto.organisationId !== existing.organisationId) {
      await this.assertOrganisationExists(dto.organisationId);
      await this.assertCustomerBelongsToOrganisation(
        existing.customerId,
        dto.organisationId,
      );
      await this.assertCustomerHasNoEcardForOrganisation(
        existing.customerId,
        dto.organisationId,
      );
    }

    const teamComponent = dto.components.find(
      (component) => component.type === 'TEAM',
    );
    if (teamComponent) {
      await this.assertTeamMembersBelongToOwnerOrganisation(
        dto.organisationId ?? existing.organisationId,
        teamComponent.members.map((member) => member.organisationMemberId),
      );
    }

    const existingGalleryComponent = existing.components.find(
      (component) => component.type === 'GALLERY',
    );
    const incomingGalleryComponent = dto.components.find(
      (component) => component.type === 'GALLERY',
    );
    await this.planEnforcementService.assertCanAddGalleryContent(
      existing.customerId,
      {
        organisationId: dto.organisationId ?? existing.organisationId,
        existingSubGalleryCount:
          existingGalleryComponent?.gallery?.subGalleries.length ?? 0,
        existingTotalImageCount:
          existingGalleryComponent?.gallery?.subGalleries.reduce(
            (sum, subGallery) => sum + subGallery.images.length,
            0,
          ) ?? 0,
      },
      incomingGalleryComponent
        ? { subGalleries: incomingGalleryComponent.subGalleries }
        : undefined,
    );

    const heroMediaId = await this.mediaSlotResolver.resolveUpdateSlot(
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
    const brochureComponent = dto.components.find(
      (component) => component.type === 'BROCHURE',
    );
    const brochureMediaId = await this.mediaSlotResolver.resolveUpdateSlot(
      brochureComponent?.pdf,
      ECARD_BROCHURE_FIELD,
      fileMap,
      `${keyPrefix}/brochure`,
      existingMediaIds,
    );

    const newMediaIds = new Set(
      [heroMediaId, brochureMediaId, ...galleryMediaIds.flat()].filter(
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
          organisationId: dto.organisationId ?? null,
          heroName: dto.heroName,
          heroEmail: dto.heroEmail,
          heroCompanyName: dto.heroCompanyName,
          phoneCountryDialCode: dto.phoneCountryDialCode,
          phoneNumber: dto.phoneNumber,
          isExchangeContactEnabled: dto.isExchangeContactEnabled,
          autoDownloadContact: dto.autoDownloadContact,
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
          brochureMediaId,
        );
      }
    });

    await Promise.allSettled(
      orphanedMediaIds.map((mediaId) => this.mediaService.delete(mediaId)),
    );

    return this.getById(existing.id);
  }

  private async remove(existing: FullEcard): Promise<void> {
    const mediaIds = this.collectMediaIds(existing);
    await this.prisma.eCard.delete({ where: { id: existing.id } });
    await Promise.allSettled(
      mediaIds.map((mediaId) => this.mediaService.delete(mediaId)),
    );
  }

  // ── component satellite writes ──────────────────────────────────────────

  private async createComponentSatellite(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    ecardComponentId: string,
    component: EcardComponentInputDto | UpdateEcardComponentInputDto,
    galleryMediaIds: (string | undefined)[][],
    brochureMediaId: string | undefined,
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
      case 'BROCHURE':
        if (!brochureMediaId) {
          throw new BadRequestException(
            'Missing uploaded PDF for brochure component',
          );
        }
        await tx.eCardBrochureComponent.create({
          data: { ecardComponentId, pdfMediaId: brochureMediaId },
        });
        return;
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
            this.mediaSlotResolver.resolveUploadSlot(
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
            this.mediaSlotResolver.resolveUpdateSlot(
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

  // ── assertions ───────────────────────────────────────────────────────────

  private async assertUnderEcardCap(customerId: string): Promise<void> {
    const count = await this.prisma.eCard.count({ where: { customerId } });
    if (count >= ECARD_MAX_PER_CUSTOMER) {
      throw new BadRequestException(
        `This customer already has the maximum of ${ECARD_MAX_PER_CUSTOMER} e-cards`,
      );
    }
  }

  private async assertOrganisationExists(
    organisationId: string,
  ): Promise<void> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });
    if (!organisation) {
      throw new BadRequestException(
        'organisationId does not reference an existing organisation',
      );
    }
  }

  private async assertCustomerHasNoEcardForOrganisation(
    customerId: string,
    organisationId: string,
  ): Promise<void> {
    const existing = await this.prisma.eCard.findUnique({
      where: { customerId_organisationId: { customerId, organisationId } },
    });
    if (existing) {
      throw new ConflictException(
        'This customer already has an e-card for this organisation',
      );
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
    organisationId: string | null,
    organisationMemberIds: string[],
  ): Promise<void> {
    if (organisationMemberIds.length === 0) {
      return;
    }
    if (!organisationId) {
      throw new BadRequestException(
        'Cannot add team members: this card is not linked to an organisation yet',
      );
    }
    const uniqueIds = new Set(organisationMemberIds);
    const validCount = await this.prisma.organisationMember.count({
      where: {
        id: { in: [...uniqueIds] },
        organisationId,
      },
    });
    if (validCount !== uniqueIds.size) {
      throw new BadRequestException(
        "One or more team members do not belong to this card's organisation",
      );
    }
  }

  private async assertCustomerBelongsToOrganisation(
    customerId: string,
    organisationId: string,
  ): Promise<void> {
    const membership = await this.prisma.organisationMember.findUnique({
      where: { customerId_organisationId: { customerId, organisationId } },
    });
    if (!membership) {
      throw new BadRequestException(
        'Customer does not belong to this organisation',
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
      ...card.components.map((component) => component.brochure?.pdfMediaId),
    ];
    return ids.filter((id): id is string => Boolean(id));
  }

  private toResponse(card: FullEcard) {
    const ownerOrganisationId = card.organisationId;
    return {
      id: card.id,
      endpoint: card.endpoint,
      customerId: card.customerId,
      organisationId: card.organisationId,
      createdByEmployeeId: card.createdByEmployeeId,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      hero: {
        name: card.heroName,
        email: card.heroEmail,
        companyName: card.heroCompanyName,
        profilePhotoMediaId: card.heroProfilePhotoMediaId,
        profilePhotoUrl: card.heroProfilePhoto
          ? this.mediaService.getPublicUrl(card.heroProfilePhoto)
          : null,
        phoneCountryDialCode: card.phoneCountryDialCode,
        phoneNumber: card.phoneNumber,
        isExchangeContactEnabled: card.isExchangeContactEnabled,
        autoDownloadContact: card.autoDownloadContact,
      },
      components: card.components.map((component) =>
        this.componentToResponse(component, ownerOrganisationId),
      ),
    };
  }

  private componentToResponse(
    component: FullEcardComponent,
    ownerOrganisationId: string | null,
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
                imageUrl: this.mediaService.getPublicUrl(image.image),
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
            this.teamMemberToResponse(member, ownerOrganisationId),
          ),
        };
      case ECardComponentType.BROCHURE:
        return {
          ...base,
          type: ECardComponentType.BROCHURE,
          pdfMediaId: component.brochure?.pdfMediaId ?? null,
          pdfUrl: component.brochure?.pdf
            ? this.mediaService.getPublicUrl(component.brochure.pdf)
            : null,
          fileName: component.brochure?.pdf?.originalName ?? null,
        };
    }
  }

  private teamMemberToResponse(
    member: FullTeamMember,
    ownerOrganisationId: string | null,
  ): EcardTeamMemberResponse {
    const customer = member.organisationMember.customer;
    const orgCard = ownerOrganisationId
      ? customer.ecards.find((e) => e.organisationId === ownerOrganisationId)
      : undefined;
    return {
      organisationMemberId: member.organisationMemberId,
      name: customer.account.name,
      email: customer.account.email,
      photoUrl: customer.pfpMedia
        ? this.mediaService.getPublicUrl(customer.pfpMedia)
        : null,
      phoneCountryDialCode: orgCard?.phoneCountryDialCode ?? null,
      phoneNumber: orgCard?.phoneNumber ?? null,
      ecardEndpoint: orgCard?.endpoint ?? null,
    };
  }
}

export type PublicEcard = Awaited<ReturnType<EcardsService['getByEndpoint']>>;
