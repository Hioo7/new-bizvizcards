import { BadRequestException, Injectable } from '@nestjs/common';
import { MediaSlotResolverService } from '../../../common/media/media-slot-resolver.service';
import { MediaService } from '../../../common/media/media.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ECardComponentType } from '../../../generated/prisma/client';
import type {
  OrganisationEcardTemplateComponentInputDto,
  OrganisationEcardTemplateDto,
} from '../dto/organisation-ecard-template.dto';
import {
  ORGANISATION_ECARD_TEMPLATE_BROCHURE_FIELD,
  ORGANISATION_ECARD_TEMPLATE_HERO_PHOTO_FIELD,
  ORGANISATION_ECARD_TEMPLATE_STORAGE_KEY_PREFIX,
  organisationEcardTemplateGalleryImageField,
} from '../organisations.constants';
import { OrganisationsService } from './organisations.service';

const FULL_INCLUDE = {
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

type FullTemplate = NonNullable<
  Awaited<ReturnType<OrganisationEcardTemplateService['findByOrganisationId']>>
>;
type FullTemplateComponent = FullTemplate['components'][number];
type FullTemplateTeamMember = NonNullable<
  FullTemplateComponent['team']
>['members'][number];

export interface OrganisationEcardTemplateComponentResponseBase {
  id: string;
  order: number;
}

export interface OrganisationEcardTemplateAboutComponentResponse extends OrganisationEcardTemplateComponentResponseBase {
  type: typeof ECardComponentType.ABOUT;
  profession: string | null;
  shortNote: string | null;
  description: string | null;
  aboutMe: string | null;
}

export interface OrganisationEcardTemplateSocialLinksComponentResponse extends OrganisationEcardTemplateComponentResponseBase {
  type: typeof ECardComponentType.SOCIAL_LINKS;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedIn: string | null;
}

export interface OrganisationEcardTemplateVideoComponentResponse extends OrganisationEcardTemplateComponentResponseBase {
  type: typeof ECardComponentType.VIDEO;
  title: string | null;
  videoUrl: string | null;
}

export interface OrganisationEcardTemplateGalleryImageResponse {
  imageMediaId: string;
  imageUrl: string;
}

export interface OrganisationEcardTemplateSubGalleryResponse {
  id: string;
  title: string | null;
  images: OrganisationEcardTemplateGalleryImageResponse[];
}

export interface OrganisationEcardTemplateGalleryComponentResponse extends OrganisationEcardTemplateComponentResponseBase {
  type: typeof ECardComponentType.GALLERY;
  subGalleries: OrganisationEcardTemplateSubGalleryResponse[];
}

export interface OrganisationEcardTemplateTeamMemberResponse {
  organisationMemberId: string;
  name: string;
  email: string;
  photoUrl: string | null;
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
  ecardEndpoint: string | null;
}

export interface OrganisationEcardTemplateTeamComponentResponse extends OrganisationEcardTemplateComponentResponseBase {
  type: typeof ECardComponentType.TEAM;
  title: string | null;
  members: OrganisationEcardTemplateTeamMemberResponse[];
}

export interface OrganisationEcardTemplateWhatsAppComponentResponse extends OrganisationEcardTemplateComponentResponseBase {
  type: typeof ECardComponentType.WHATSAPP;
  phoneCountryDialCode: string | null;
  phoneNumber: string | null;
}

export interface OrganisationEcardTemplateBrochureComponentResponse extends OrganisationEcardTemplateComponentResponseBase {
  type: typeof ECardComponentType.BROCHURE;
  pdfMediaId: string | null;
  pdfUrl: string | null;
  fileName: string | null;
}

export type OrganisationEcardTemplateComponentResponse =
  | OrganisationEcardTemplateAboutComponentResponse
  | OrganisationEcardTemplateSocialLinksComponentResponse
  | OrganisationEcardTemplateVideoComponentResponse
  | OrganisationEcardTemplateGalleryComponentResponse
  | OrganisationEcardTemplateTeamComponentResponse
  | OrganisationEcardTemplateWhatsAppComponentResponse
  | OrganisationEcardTemplateBrochureComponentResponse;

export interface OrganisationEcardTemplateResponse {
  id: string;
  organisationId: string;
  createdAt: Date;
  updatedAt: Date;
  hero: {
    name: string | null;
    email: string | null;
    companyName: string | null;
    profilePhotoMediaId: string | null;
    profilePhotoUrl: string | null;
    phoneCountryDialCode: string | null;
    phoneNumber: string | null;
  };
  components: OrganisationEcardTemplateComponentResponse[];
}

/**
 * CRUD for an organisation's e-card template — a single (at most one per
 * org) branding/content template built with the same component system as an
 * individual e-card, but every field optional. Never applied here — see
 * organisation-ecard-template-merge.util.ts (ecards module) for how this is
 * merged, read-time only, onto every e-card linked to the organisation.
 */
@Injectable()
export class OrganisationEcardTemplateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly mediaSlotResolver: MediaSlotResolverService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  async getByOrganisationId(
    organisationId: string,
  ): Promise<OrganisationEcardTemplateResponse | null> {
    const template = await this.findByOrganisationId(organisationId);
    return template ? this.toResponse(template) : null;
  }

  async upsertForEmployee(
    organisationId: string,
    dto: OrganisationEcardTemplateDto,
    files: Express.Multer.File[],
  ): Promise<OrganisationEcardTemplateResponse> {
    await this.organisationsService.getByIdForEmployee(organisationId);
    return this.upsert(organisationId, dto, files);
  }

  async upsertForSpoc(
    actorCustomerId: string,
    organisationId: string,
    dto: OrganisationEcardTemplateDto,
    files: Express.Multer.File[],
  ): Promise<OrganisationEcardTemplateResponse> {
    await this.organisationsService.assertIsSpoc(
      actorCustomerId,
      organisationId,
    );
    return this.upsert(organisationId, dto, files);
  }

  async getForMember(
    actorCustomerId: string,
    organisationId: string,
  ): Promise<OrganisationEcardTemplateResponse | null> {
    await this.organisationsService.assertIsMember(
      actorCustomerId,
      organisationId,
    );
    return this.getByOrganisationId(organisationId);
  }

  async deleteForEmployee(organisationId: string): Promise<void> {
    await this.organisationsService.getByIdForEmployee(organisationId);
    await this.delete(organisationId);
  }

  async deleteForSpoc(
    actorCustomerId: string,
    organisationId: string,
  ): Promise<void> {
    await this.organisationsService.assertIsSpoc(
      actorCustomerId,
      organisationId,
    );
    await this.delete(organisationId);
  }

  // ── shared delete ────────────────────────────────────────────────────────

  // Removing the template entirely (not just clearing every field) is what
  // reverts every linked member's card back to fully untouched — a template
  // row with zero components is a "uniform of nothing" and would hide every
  // member's own components, which is not the same thing as no policy at
  // all (see organisation-ecard-template-merge.util.ts).
  private async delete(organisationId: string): Promise<void> {
    const existing = await this.findByOrganisationId(organisationId);
    if (!existing) {
      return;
    }

    const mediaIds = this.collectMediaIds(existing);
    await this.prisma.organisationEcardTemplate.delete({
      where: { organisationId },
    });
    await Promise.allSettled(
      mediaIds.map((mediaId) => this.mediaService.delete(mediaId)),
    );
  }

  // ── shared upsert ────────────────────────────────────────────────────────

  private async upsert(
    organisationId: string,
    dto: OrganisationEcardTemplateDto,
    files: Express.Multer.File[],
  ): Promise<OrganisationEcardTemplateResponse> {
    const existing = await this.findByOrganisationId(organisationId);
    const existingMediaIds = new Set(
      existing ? this.collectMediaIds(existing) : [],
    );
    const keyPrefix = `${ORGANISATION_ECARD_TEMPLATE_STORAGE_KEY_PREFIX}/${organisationId}`;
    const fileMap = this.mediaSlotResolver.buildFileMap(files);

    const teamComponent = dto.components.find(
      (component) => component.type === 'TEAM',
    );
    if (teamComponent) {
      await this.assertTeamMembersBelongToOrganisation(
        organisationId,
        teamComponent.members.map((member) => member.organisationMemberId),
      );
    }

    const heroMediaId = await this.mediaSlotResolver.resolveUpdateSlot(
      dto.heroProfilePhoto,
      ORGANISATION_ECARD_TEMPLATE_HERO_PHOTO_FIELD,
      fileMap,
      `${keyPrefix}/hero`,
      existingMediaIds,
    );
    const galleryMediaIds = await this.resolveGalleryUploads(
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
      ORGANISATION_ECARD_TEMPLATE_BROCHURE_FIELD,
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

    const templateId = await this.prisma.$transaction(async (tx) => {
      // Every scalar field here is optional on the DTO (blank means "defer
      // to the customer"), so each is coerced to `?? null` explicitly —
      // Prisma's `update` treats an `undefined` field value as "leave
      // unchanged," not "clear it," which would otherwise leave a
      // previously-set field stuck even after the SPOC blanks it out.
      const template = await tx.organisationEcardTemplate.upsert({
        where: { organisationId },
        create: {
          organisationId,
          heroName: dto.heroName ?? null,
          heroEmail: dto.heroEmail ?? null,
          heroCompanyName: dto.heroCompanyName ?? null,
          phoneCountryDialCode: dto.phoneCountryDialCode ?? null,
          phoneNumber: dto.phoneNumber ?? null,
          heroProfilePhotoMediaId: heroMediaId ?? null,
        },
        update: {
          heroName: dto.heroName ?? null,
          heroEmail: dto.heroEmail ?? null,
          heroCompanyName: dto.heroCompanyName ?? null,
          phoneCountryDialCode: dto.phoneCountryDialCode ?? null,
          phoneNumber: dto.phoneNumber ?? null,
          heroProfilePhotoMediaId: heroMediaId ?? null,
        },
      });

      await tx.organisationEcardTemplateComponent.deleteMany({
        where: { templateId: template.id },
      });

      for (let i = 0; i < dto.components.length; i++) {
        const component = dto.components[i];
        const componentRow = await tx.organisationEcardTemplateComponent.create(
          {
            data: {
              templateId: template.id,
              type: ECardComponentType[component.type],
              order: i,
            },
          },
        );
        await this.createComponentSatellite(
          tx,
          componentRow.id,
          component,
          galleryMediaIds,
          brochureMediaId,
        );
      }

      return template.id;
    });

    await Promise.allSettled(
      orphanedMediaIds.map((mediaId) => this.mediaService.delete(mediaId)),
    );

    return this.getByOrganisationId(organisationId).then((response) => {
      if (!response) {
        throw new BadRequestException(
          `Organisation e-card template ${templateId} was not found after saving`,
        );
      }
      return response;
    });
  }

  // ── component satellite writes ──────────────────────────────────────────

  private async createComponentSatellite(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    templateComponentId: string,
    component: OrganisationEcardTemplateComponentInputDto,
    galleryMediaIds: (string | undefined)[][],
    brochureMediaId: string | undefined,
  ): Promise<void> {
    switch (component.type) {
      case 'ABOUT':
        await tx.organisationEcardTemplateAboutComponent.create({
          data: {
            templateComponentId,
            profession: component.profession,
            shortNote: component.shortNote,
            description: component.description,
            aboutMe: component.aboutMe,
          },
        });
        return;
      case 'SOCIAL_LINKS':
        await tx.organisationEcardTemplateSocialLinksComponent.create({
          data: {
            templateComponentId,
            website: component.website,
            instagram: component.instagram,
            facebook: component.facebook,
            twitter: component.twitter,
            linkedIn: component.linkedIn,
          },
        });
        return;
      case 'WHATSAPP':
        await tx.organisationEcardTemplateWhatsAppComponent.create({
          data: {
            templateComponentId,
            phoneCountryDialCode: component.phoneCountryDialCode,
            phoneNumber: component.phoneNumber,
          },
        });
        return;
      case 'VIDEO':
        await tx.organisationEcardTemplateVideoComponent.create({
          data: {
            templateComponentId,
            title: component.title,
            videoUrl: component.videoUrl,
          },
        });
        return;
      case 'GALLERY': {
        const galleryRow =
          await tx.organisationEcardTemplateGalleryComponent.create({
            data: { templateComponentId },
          });
        for (let g = 0; g < component.subGalleries.length; g++) {
          const subGallery = component.subGalleries[g];
          const subGalleryRow =
            await tx.organisationEcardTemplateSubGallery.create({
              data: {
                galleryComponentId: galleryRow.templateComponentId,
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
            await tx.organisationEcardTemplateGalleryImage.create({
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
        const teamRow = await tx.organisationEcardTemplateTeamComponent.create({
          data: { templateComponentId, title: component.title },
        });
        for (let m = 0; m < component.members.length; m++) {
          await tx.organisationEcardTemplateTeamMember.create({
            data: {
              teamComponentId: teamRow.templateComponentId,
              organisationMemberId: component.members[m].organisationMemberId,
              order: m,
            },
          });
        }
        return;
      }
      case 'BROCHURE':
        if (!brochureMediaId) {
          return;
        }
        await tx.organisationEcardTemplateBrochureComponent.create({
          data: { templateComponentId, pdfMediaId: brochureMediaId },
        });
        return;
    }
  }

  // ── media upload resolution ─────────────────────────────────────────────

  private async resolveGalleryUploads(
    components: OrganisationEcardTemplateComponentInputDto[],
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
              organisationEcardTemplateGalleryImageField(g, j),
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

  private async assertTeamMembersBelongToOrganisation(
    organisationId: string,
    organisationMemberIds: string[],
  ): Promise<void> {
    if (organisationMemberIds.length === 0) {
      return;
    }
    const uniqueIds = new Set(organisationMemberIds);
    const validCount = await this.prisma.organisationMember.count({
      where: { id: { in: [...uniqueIds] }, organisationId },
    });
    if (validCount !== uniqueIds.size) {
      throw new BadRequestException(
        'One or more team members do not belong to this organisation',
      );
    }
  }

  // ── read helpers ─────────────────────────────────────────────────────────

  private async findByOrganisationId(organisationId: string) {
    return this.prisma.organisationEcardTemplate.findUnique({
      where: { organisationId },
      include: FULL_INCLUDE,
    });
  }

  private collectMediaIds(template: FullTemplate): string[] {
    const ids: (string | null | undefined)[] = [
      template.heroProfilePhotoMediaId,
      ...template.components.flatMap(
        (component) =>
          component.gallery?.subGalleries.flatMap((subGallery) =>
            subGallery.images.map((image) => image.imageMediaId),
          ) ?? [],
      ),
      ...template.components.map((component) => component.brochure?.pdfMediaId),
    ];
    return ids.filter((id): id is string => Boolean(id));
  }

  private toResponse(
    template: FullTemplate,
  ): OrganisationEcardTemplateResponse {
    const organisationId = template.organisationId;
    return {
      id: template.id,
      organisationId,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      hero: {
        name: template.heroName,
        email: template.heroEmail,
        companyName: template.heroCompanyName,
        profilePhotoMediaId: template.heroProfilePhotoMediaId,
        profilePhotoUrl: template.heroProfilePhoto
          ? this.mediaService.getPublicUrl(template.heroProfilePhoto)
          : null,
        phoneCountryDialCode: template.phoneCountryDialCode,
        phoneNumber: template.phoneNumber,
      },
      components: template.components.map((component) =>
        this.componentToResponse(component, organisationId),
      ),
    };
  }

  private componentToResponse(
    component: FullTemplateComponent,
    organisationId: string,
  ): OrganisationEcardTemplateComponentResponse {
    const base: OrganisationEcardTemplateComponentResponseBase = {
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
            this.teamMemberToResponse(member, organisationId),
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
    member: FullTemplateTeamMember,
    organisationId: string,
  ): OrganisationEcardTemplateTeamMemberResponse {
    const customer = member.organisationMember.customer;
    const orgCard = customer.ecards.find(
      (e) => e.organisationId === organisationId,
    );
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
