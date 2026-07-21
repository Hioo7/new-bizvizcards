import { Injectable } from '@nestjs/common';
import {
  ECardComponentType,
  MigrationDomain,
  MigrationRecordStatus,
  Prisma,
} from '../../../../generated/prisma/client';
import { Prisma as LegacyPrisma } from '../../../../generated/legacy-prisma/client';
import { PRISMA_ERROR_CODES } from '../../../../common/constants/prisma-error-codes.constants';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import { LegacyIdMapperService } from '../legacy-id-mapper.service';
import { LegacyMediaTransferService } from '../legacy-media-transfer.service';
import { iterateLegacyRows } from '../iterate-legacy-rows.util';
import {
  ECARD_MIGRATION_DEFAULT_DIAL_CODE,
  ECARD_MIGRATION_LOCAL_NUMBER_LENGTH,
  MIGRATION_REJECTION_REASON,
  MIGRATION_SOURCE_TABLE,
  MigrationRejectionReason,
} from '../../migration.constants';
import type { DomainMigrator } from './domain-migrator.interface';

const LEGACY_ECARD_INCLUDE = {
  cardUser: { include: { permissions: true } },
} as const;

type LegacyECardWithOwner = LegacyPrisma.LegacyECardGetPayload<{
  include: typeof LEGACY_ECARD_INCLUDE;
}>;

// The one domain requiring real field transformation — legacy ECard is a
// flat table, the new ECard's content lives in modular ECardComponents. See
// the migration plan's field-mapping table. ECard.customerId is required
// (unlike SmartCard.customerId, which is nullable), so an unmigrated owner
// is a hard rejection here, not a soft "unassigned" note.
@Injectable()
export class EcardMigrator implements DomainMigrator {
  readonly domain = MigrationDomain.ECARD;

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly idMapper: LegacyIdMapperService,
    private readonly mediaTransfer: LegacyMediaTransferService,
  ) {}

  async countTotal(): Promise<number> {
    return this.legacyPrisma.legacyECard.count();
  }

  async migrate(jobId: string): Promise<void> {
    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacyECard.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
          include: LEGACY_ECARD_INCLUDE,
        }),
      (legacyEcard) => this.migrateOne(legacyEcard, jobId),
    );
  }

  private async migrateOne(
    legacyEcard: LegacyECardWithOwner,
    jobId: string,
  ): Promise<void> {
    const existing = await this.idMapper.findExisting(
      this.domain,
      MIGRATION_SOURCE_TABLE.ECARD,
      legacyEcard.id,
    );
    if (existing?.status === MigrationRecordStatus.SUCCESS) {
      await this.idMapper.touchExistingSuccess(
        this.domain,
        MIGRATION_SOURCE_TABLE.ECARD,
        legacyEcard.id,
        jobId,
      );
      return;
    }

    const customerId = await this.idMapper.resolveTargetId(
      MigrationDomain.CUSTOMER_IDENTITY,
      MIGRATION_SOURCE_TABLE.CARD_USER,
      legacyEcard.cardUserId,
    );
    if (!customerId) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.ECARD,
        sourceId: legacyEcard.id,
        reason: MIGRATION_REJECTION_REASON.OWNING_CUSTOMER_NOT_MIGRATED,
        jobId,
      });
      return;
    }

    // Legacy had exactly one ECard per CardUser (LegacyECard.cardUserId is
    // @unique) and implicitly treated that single ECard as "the org's card"
    // for org-level lead-fetching. The new schema makes a customer->org
    // ECard link explicit via organisationId, since a customer can now own
    // multiple ECards — so the single migrated ECard is auto-linked to the
    // owner's organisation membership to preserve that equivalent behavior.
    // OrganisationMemberMigrator already ran earlier in the pipeline (see
    // migration.module.ts), so this only ever finds genuinely-migrated
    // memberships. A customer with no membership simply gets organisationId
    // null, same as before this change. orderBy+findFirst gives a
    // deterministic pick in the structurally-possible (if unusual in
    // practice) case of multiple memberships.
    const membership = await this.prisma.organisationMember.findFirst({
      where: { customerId },
      orderBy: { joinedAt: 'asc' },
      select: { organisationId: true },
    });
    const organisationId = membership?.organisationId ?? null;

    const endpointTaken = await this.prisma.eCard.findUnique({
      where: { endpoint: legacyEcard.endpoint },
      select: { id: true },
    });
    if (endpointTaken) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.ECARD,
        sourceId: legacyEcard.id,
        reason: MIGRATION_REJECTION_REASON.ENDPOINT_ALREADY_TAKEN,
        jobId,
      });
      return;
    }

    let note: MigrationRejectionReason | undefined;

    const heroPhoto = await this.mediaTransfer.transfer({
      legacyMediaId: legacyEcard.mediaId,
      legacyPlainUrl: legacyEcard.imageUrl,
      sourceTable: MIGRATION_SOURCE_TABLE.ECARD_IMAGE,
      sourceId: legacyEcard.id,
      keyPrefixSuffix: `ecard/${legacyEcard.id}/hero-photo`,
      jobId,
      originalName: 'hero-photo',
    });
    if (!heroPhoto && (legacyEcard.mediaId || legacyEcard.imageUrl)) {
      note = MIGRATION_REJECTION_REASON.PROFILE_PHOTO_TRANSFER_FAILED;
    }

    const whatsapp = legacyEcard.whatsapp
      ? this.parseWhatsappNumber(
          legacyEcard.whatsapp,
          legacyEcard.mob_country_code,
        )
      : null;
    if (legacyEcard.whatsapp && !whatsapp && !note) {
      note = MIGRATION_REJECTION_REASON.WHATSAPP_NUMBER_UNPARSEABLE;
    }

    try {
      const ecard = await this.prisma.$transaction(async (tx) => {
        const created = await tx.eCard.create({
          data: {
            customerId,
            endpoint: legacyEcard.endpoint,
            organisationId,
            heroName: legacyEcard.cardUser.name,
            heroEmail: legacyEcard.cardUser.email,
            heroCompanyName: null,
            heroProfilePhotoMediaId: heroPhoto?.id ?? null,
            phoneCountryDialCode:
              legacyEcard.mob_country_code != null
                ? `+${legacyEcard.mob_country_code}`
                : null,
            phoneNumber:
              legacyEcard.mobile_number != null
                ? String(legacyEcard.mobile_number)
                : null,
            isExchangeContactEnabled:
              legacyEcard.cardUser.permissions?.isExchangeContactEnabled ??
              true,
            createdByEmployeeId: null,
          },
        });

        let order = 0;

        // ABOUT — exact 1:1 field match with legacy, always created.
        const aboutComponent = await tx.eCardComponent.create({
          data: {
            ecardId: created.id,
            type: ECardComponentType.ABOUT,
            order: order++,
          },
        });
        await tx.eCardAboutComponent.create({
          data: {
            ecardComponentId: aboutComponent.id,
            profession: legacyEcard.Profession,
            shortNote: legacyEcard.shortNote,
            description: legacyEcard.description,
            aboutMe: legacyEcard.aboutme,
          },
        });

        const hasSocialLinks =
          legacyEcard.website ||
          legacyEcard.instagram ||
          legacyEcard.facebook ||
          legacyEcard.twitter ||
          legacyEcard.linkedin;
        if (hasSocialLinks) {
          const socialComponent = await tx.eCardComponent.create({
            data: {
              ecardId: created.id,
              type: ECardComponentType.SOCIAL_LINKS,
              order: order++,
            },
          });
          await tx.eCardSocialLinksComponent.create({
            data: {
              ecardComponentId: socialComponent.id,
              website: legacyEcard.website,
              instagram: legacyEcard.instagram,
              facebook: legacyEcard.facebook,
              twitter: legacyEcard.twitter,
              linkedIn: legacyEcard.linkedin,
            },
          });
        }

        if (whatsapp) {
          const whatsappComponent = await tx.eCardComponent.create({
            data: {
              ecardId: created.id,
              type: ECardComponentType.WHATSAPP,
              order: order++,
            },
          });
          await tx.eCardWhatsAppComponent.create({
            data: {
              ecardComponentId: whatsappComponent.id,
              phoneCountryDialCode: whatsapp.phoneCountryDialCode,
              phoneNumber: whatsapp.phoneNumber,
            },
          });
        }

        return created;
      });

      await this.idMapper.recordSuccess({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.ECARD,
        sourceId: legacyEcard.id,
        targetTable: 'ECard',
        targetId: ecard.id,
        jobId,
        note,
      });
    } catch (error) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.ECARD,
        sourceId: legacyEcard.id,
        reason: this.classifyError(error),
        jobId,
      });
    }
  }

  // Legacy `whatsapp` is a single free-text field (unlike the structured
  // mob_country_code/mobile_number columns). Confirmed against real
  // production data: the overwhelming majority (93%) of legacy whatsapp
  // values are a bare local number with no country-code prefix at all —
  // only a small minority embed the dial code. India (91) is the only dial
  // code ever observed in the dataset, so a row with no mob_country_code at
  // all still gets a sensible default rather than being dropped. A rarer
  // shape also occurs: legacy's own card template accepted a ready-made
  // "https://wa.me/<digits>" link as the whatsapp value (see
  // cardone.template/template.tsx's `isFullWaMe` handling) — the digits are
  // extracted and parsed the same as any other number below, rather than
  // treating the URL itself as unparseable.
  //
  // A bare `\d{1,3}` dial-code regex is ambiguous by construction — e.g.
  // "+919876543210" greedily matches dial code "919" + number "876543210"
  // just as validly as the intended "+91" + "9876543210". To resolve that,
  // only a cleaned digit string longer than a bare Indian local number
  // (ECARD_MIGRATION_LOCAL_NUMBER_LENGTH) is treated as possibly embedding a
  // country code, and only if it actually starts with the known/default
  // code — anything else at that length is an unrecognizable (e.g. foreign)
  // format, not a safe guess, and is treated as unparseable.
  private parseWhatsappNumber(
    raw: string,
    knownCountryCode: number | null,
  ): { phoneCountryDialCode: string; phoneNumber: string } | null {
    const waMeMatch = /^https?:\/\/wa\.me\/?(\d+)/i.exec(raw.trim());
    const source = waMeMatch ? waMeMatch[1] : raw;

    const cleaned = source.replace(/[\s\-()]/g, '').replace(/^\+/, '');
    if (!/^\d{7,17}$/.test(cleaned)) {
      return null;
    }

    const codeStr =
      knownCountryCode != null
        ? String(knownCountryCode)
        : ECARD_MIGRATION_DEFAULT_DIAL_CODE;

    if (cleaned.length > ECARD_MIGRATION_LOCAL_NUMBER_LENGTH) {
      if (!cleaned.startsWith(codeStr)) {
        return null;
      }
      const phoneNumber = cleaned.slice(codeStr.length);
      if (phoneNumber.length < 6) {
        return null;
      }
      return { phoneCountryDialCode: `+${codeStr}`, phoneNumber };
    }

    // The dominant real-world shape: a bare local number, no prefix at all.
    return { phoneCountryDialCode: `+${codeStr}`, phoneNumber: cleaned };
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
