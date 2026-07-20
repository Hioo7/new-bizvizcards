import { Injectable } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecordStatus,
  Prisma,
} from '../../../../generated/prisma/client';
import { Prisma as LegacyPrisma } from '../../../../generated/legacy-prisma/client';
import { PRISMA_ERROR_CODES } from '../../../../common/constants/prisma-error-codes.constants';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import { MediaModel } from '../../../../generated/prisma/models';
import { LegacyIdMapperService } from '../legacy-id-mapper.service';
import { LegacyMediaTransferService } from '../legacy-media-transfer.service';
import { iterateLegacyRows } from '../iterate-legacy-rows.util';
import {
  MIGRATION_REJECTION_REASON,
  MIGRATION_SOURCE_TABLE,
  MigrationRejectionReason,
  SMART_CARD_TEMPLATE_SLUG_MAP,
} from '../../migration.constants';
import type { DomainMigrator } from './domain-migrator.interface';

const LEGACY_SMART_CARD_INCLUDE = {
  template: true,
  profile: true,
  contact: true,
  socialMedia: true,
  founder: true,
  services: true,
  testimonials: true,
  galleries: { include: { images: true } },
} as const;

type LegacySmartCardWithChildren = LegacyPrisma.LegacySmartCardGetPayload<{
  include: typeof LEGACY_SMART_CARD_INCLUDE;
}>;

// A near 1:1 structural match with legacy — the simplest domain in the
// pipeline besides identity. Everything (SmartCard + every child table) is
// tracked under a single SMART_CARD-domain MigrationRecord, since it's all
// created together in one transaction per legacy SmartCard row. Media for
// each image field is resolved (via LegacyMediaTransferService, itself
// independently idempotent) *before* that transaction opens.
@Injectable()
export class SmartCardMigrator implements DomainMigrator {
  readonly domain = MigrationDomain.SMART_CARD;

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly idMapper: LegacyIdMapperService,
    private readonly mediaTransfer: LegacyMediaTransferService,
  ) {}

  async countTotal(): Promise<number> {
    return this.legacyPrisma.legacySmartCard.count();
  }

  async migrate(jobId: string): Promise<void> {
    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacySmartCard.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
          include: LEGACY_SMART_CARD_INCLUDE,
        }),
      (legacySmartCard) => this.migrateOne(legacySmartCard, jobId),
    );
  }

  private async migrateOne(
    legacySmartCard: LegacySmartCardWithChildren,
    jobId: string,
  ): Promise<void> {
    const existing = await this.idMapper.findExisting(
      this.domain,
      MIGRATION_SOURCE_TABLE.SMART_CARD,
      legacySmartCard.id,
    );
    if (existing?.status === MigrationRecordStatus.SUCCESS) {
      await this.idMapper.touchExistingSuccess(
        this.domain,
        MIGRATION_SOURCE_TABLE.SMART_CARD,
        legacySmartCard.id,
        jobId,
      );
      return;
    }

    const templateKey =
      SMART_CARD_TEMPLATE_SLUG_MAP[legacySmartCard.template.slug];
    const targetTemplate = templateKey
      ? await this.prisma.smartCardTemplate.findUnique({
          where: { key: templateKey },
          select: { id: true },
        })
      : null;
    if (!targetTemplate) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.SMART_CARD,
        sourceId: legacySmartCard.id,
        reason: MIGRATION_REJECTION_REASON.UNRECOGNIZED_TEMPLATE_SLUG,
        jobId,
      });
      return;
    }

    const endpointTaken = await this.prisma.smartCard.findUnique({
      where: { endpoint: legacySmartCard.endpoint },
      select: { id: true },
    });
    if (endpointTaken) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.SMART_CARD,
        sourceId: legacySmartCard.id,
        reason: MIGRATION_REJECTION_REASON.ENDPOINT_ALREADY_TAKEN,
        jobId,
      });
      return;
    }

    let customerId: string | null = null;
    let ownerNote: MigrationRejectionReason | undefined;
    if (legacySmartCard.cardUserId) {
      customerId = await this.idMapper.resolveTargetId(
        MigrationDomain.CUSTOMER_IDENTITY,
        MIGRATION_SOURCE_TABLE.CARD_USER,
        legacySmartCard.cardUserId,
      );
      if (!customerId) {
        ownerNote =
          MIGRATION_REJECTION_REASON.OWNER_NOT_MIGRATED_CARD_UNASSIGNED;
      }
    }

    const profileLogo = legacySmartCard.profile
      ? await this.mediaTransfer.transfer({
          legacyMediaId: legacySmartCard.profile.mediaId,
          legacyPlainUrl: legacySmartCard.profile.logoUrl,
          sourceTable: MIGRATION_SOURCE_TABLE.SMART_CARD_PROFILE_LOGO,
          sourceId: legacySmartCard.id,
          keyPrefixSuffix: `smart-card/${legacySmartCard.id}/profile-logo`,
          jobId,
          originalName: 'profile-logo',
        })
      : null;

    const founderImage = legacySmartCard.founder
      ? await this.mediaTransfer.transfer({
          legacyMediaId: legacySmartCard.founder.mediaId,
          legacyPlainUrl: legacySmartCard.founder.imageUrl,
          sourceTable: MIGRATION_SOURCE_TABLE.SMART_CARD_FOUNDER_IMAGE,
          sourceId: legacySmartCard.id,
          keyPrefixSuffix: `smart-card/${legacySmartCard.id}/founder-image`,
          jobId,
          originalName: 'founder-image',
        })
      : null;

    const serviceMediaById = new Map<string, MediaModel | null>();
    for (const service of legacySmartCard.services) {
      const media = await this.mediaTransfer.transfer({
        legacyMediaId: service.mediaId,
        legacyPlainUrl: service.imageUrl,
        sourceTable: MIGRATION_SOURCE_TABLE.SMART_CARD_SERVICE_IMAGE,
        sourceId: service.id,
        keyPrefixSuffix: `smart-card/${legacySmartCard.id}/service/${service.id}`,
        jobId,
        originalName: 'service-image',
      });
      serviceMediaById.set(service.id, media);
    }

    // SmartCardGalleryImage.imageMediaId is required (not nullable) in the
    // new schema — an image whose media transfer failed cannot be created
    // at all, so it's dropped from the migrated gallery rather than failing
    // the whole SmartCard. The MEDIA-domain MigrationRecord already
    // captured why (MEDIA_URL_UNREACHABLE etc.), visible in the report.
    const galleryImageMediaById = new Map<string, MediaModel>();
    for (const gallery of legacySmartCard.galleries) {
      for (const image of gallery.images) {
        const media = await this.mediaTransfer.transfer({
          legacyMediaId: image.mediaId,
          legacyPlainUrl: image.url,
          sourceTable: MIGRATION_SOURCE_TABLE.SMART_CARD_GALLERY_IMAGE,
          sourceId: image.id,
          keyPrefixSuffix: `smart-card/${legacySmartCard.id}/gallery-image/${image.id}`,
          jobId,
          originalName: 'gallery-image',
        });
        if (media) {
          galleryImageMediaById.set(image.id, media);
        }
      }
    }

    try {
      const smartCard = await this.prisma.$transaction(async (tx) => {
        const created = await tx.smartCard.create({
          data: {
            customerId,
            templateId: targetTemplate.id,
            endpoint: legacySmartCard.endpoint,
          },
        });

        if (legacySmartCard.profile) {
          await tx.smartCardProfile.create({
            data: {
              smartCardId: created.id,
              companyName: legacySmartCard.profile.companyName,
              tagline: legacySmartCard.profile.tagline,
              subTagline: legacySmartCard.profile.subTagline,
              aboutText: legacySmartCard.profile.aboutText,
              logoMediaId: profileLogo?.id ?? null,
            },
          });
        }

        if (legacySmartCard.contact) {
          await tx.smartCardContact.create({
            data: {
              smartCardId: created.id,
              contactNumber: legacySmartCard.contact.contactNumber,
              email: legacySmartCard.contact.email,
              address: legacySmartCard.contact.address,
            },
          });
        }

        if (legacySmartCard.socialMedia) {
          await tx.smartCardSocialMedia.create({
            data: {
              smartCardId: created.id,
              whatsapp: legacySmartCard.socialMedia.whatsapp,
              instagram: legacySmartCard.socialMedia.instagram,
              facebook: legacySmartCard.socialMedia.facebook,
              linkedIn: legacySmartCard.socialMedia.linkedIn,
              twitter: legacySmartCard.socialMedia.twitter,
              youtube: legacySmartCard.socialMedia.youtube,
              googleMap: legacySmartCard.socialMedia.googleMap,
              website: legacySmartCard.socialMedia.website,
              other: legacySmartCard.socialMedia.other,
            },
          });
        }

        if (legacySmartCard.founder) {
          await tx.smartCardFounder.create({
            data: {
              smartCardId: created.id,
              name: legacySmartCard.founder.name,
              title: legacySmartCard.founder.title,
              imageMediaId: founderImage?.id ?? null,
              experience: legacySmartCard.founder.experience,
              projects: legacySmartCard.founder.projects,
              satisfaction: legacySmartCard.founder.satisfaction,
              introText: legacySmartCard.founder.introText,
              philosophyText: legacySmartCard.founder.philosophyText,
              quote: legacySmartCard.founder.quote,
            },
          });
        }

        for (const service of legacySmartCard.services) {
          await tx.smartCardService.create({
            data: {
              smartCardId: created.id,
              title: service.title,
              description: service.description,
              imageMediaId: serviceMediaById.get(service.id)?.id ?? null,
              order: service.order,
            },
          });
        }

        for (const testimonial of legacySmartCard.testimonials) {
          await tx.smartCardTestimonial.create({
            data: {
              smartCardId: created.id,
              name: testimonial.name,
              initials: testimonial.initials,
              text: testimonial.text,
              order: testimonial.order,
            },
          });
        }

        for (const gallery of legacySmartCard.galleries) {
          const createdGallery = await tx.smartCardGallery.create({
            data: {
              smartCardId: created.id,
              title: gallery.title,
              order: gallery.order,
            },
          });
          for (const image of gallery.images) {
            const media = galleryImageMediaById.get(image.id);
            if (!media) {
              continue;
            }
            await tx.smartCardGalleryImage.create({
              data: {
                galleryId: createdGallery.id,
                imageMediaId: media.id,
                order: image.order,
              },
            });
          }
        }

        return created;
      });

      await this.idMapper.recordSuccess({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.SMART_CARD,
        sourceId: legacySmartCard.id,
        targetTable: 'SmartCard',
        targetId: smartCard.id,
        jobId,
        note: ownerNote,
      });
    } catch (error) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.SMART_CARD,
        sourceId: legacySmartCard.id,
        reason: this.classifyError(error),
        jobId,
      });
    }
  }

  private classifyError(error: unknown): MigrationRejectionReason {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION
    ) {
      return MIGRATION_REJECTION_REASON.ENDPOINT_ALREADY_TAKEN;
    }
    return MIGRATION_REJECTION_REASON.UNEXPECTED_DATABASE_ERROR;
  }
}
