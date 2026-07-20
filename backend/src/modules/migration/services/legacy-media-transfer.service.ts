import { Injectable, Logger } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecordStatus,
} from '../../../generated/prisma/client';
import { MediaModel } from '../../../generated/prisma/models';
import { LegacyStorageSource } from '../../../generated/legacy-prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AppConfigService } from '../../../common/config/app-config.service';
import { LegacyPrismaService } from '../../../common/legacy-db/legacy-prisma.service';
import { MediaService } from '../../../common/media/media.service';
import { LegacyMediaStagingClient } from './legacy-media-staging-client.service';
import { LegacyIdMapperService } from './legacy-id-mapper.service';
import { withTimeout } from './with-timeout.util';
import {
  MIGRATION_MEDIA_CONTENT_TYPE_EXTENSION,
  MIGRATION_MEDIA_KEY_PREFIX,
  MIGRATION_NETWORK_TIMEOUT_MS,
  MIGRATION_REJECTION_REASON,
} from '../migration.constants';

export interface LegacyMediaTransferParams {
  // The referenced legacy Media row's id, if the owning legacy entity has
  // one (nullable — many legacy rows only ever had the plain-string URL
  // column populated, see legacyPlainUrl below).
  legacyMediaId: string | null;
  // Fallback plain-string URL column on the owning legacy entity (e.g.
  // ECard.imageUrl, SmartCardFounder.imageUrl) — legacy's own dual-write
  // pattern (see getMediaUrl.ts): prefer the Media row when present, fall
  // back to this otherwise.
  legacyPlainUrl: string | null;
  // MIGRATION_SOURCE_TABLE.ECARD_IMAGE-style qualified label identifying
  // *which* image field this is, since one legacy row can reference several
  // (e.g. a gallery has many images) — combined with sourceId this must be
  // globally unique per distinct image reference.
  sourceTable: string;
  sourceId: string;
  // Appended to MIGRATION_MEDIA_KEY_PREFIX as the new Media row's storage
  // key prefix — typically the owning entity's legacy id, for traceability.
  keyPrefixSuffix: string;
  jobId: string;
  originalName: string;
}

// Reused by every domain migrator that owns an image field. Never rejects
// the *owning* row on failure — the caller always gets `null` back and
// proceeds without that image, per the plan's non-fatal-media-failure rule.
// Its own outcome (success/rejected/skipped) is tracked as a MEDIA-domain
// MigrationRecord, independently idempotent across re-runs.
@Injectable()
export class LegacyMediaTransferService {
  private readonly logger = new Logger(LegacyMediaTransferService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly appConfig: AppConfigService,
    private readonly mediaService: MediaService,
    private readonly legacyMediaStagingClient: LegacyMediaStagingClient,
    private readonly idMapper: LegacyIdMapperService,
  ) {}

  async transfer(
    params: LegacyMediaTransferParams,
  ): Promise<MediaModel | null> {
    const existing = await this.idMapper.findExisting(
      MigrationDomain.MEDIA,
      params.sourceTable,
      params.sourceId,
    );
    if (
      existing?.status === MigrationRecordStatus.SUCCESS &&
      existing.targetId
    ) {
      await this.idMapper.touchExistingSuccess(
        MigrationDomain.MEDIA,
        params.sourceTable,
        params.sourceId,
        params.jobId,
      );
      return this.prisma.media.findUnique({ where: { id: existing.targetId } });
    }

    let resolved: { buffer: Buffer; contentType: string } | null;
    try {
      resolved = await this.resolveBytes(params);
    } catch (error) {
      await this.idMapper.recordRejected({
        domain: MigrationDomain.MEDIA,
        sourceTable: params.sourceTable,
        sourceId: params.sourceId,
        reason: MIGRATION_REJECTION_REASON.MEDIA_URL_UNREACHABLE,
        jobId: params.jobId,
      });
      this.logger.warn(
        `Media transfer failed for ${params.sourceTable}#${params.sourceId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }

    if (!resolved) {
      await this.idMapper.recordSkipped({
        domain: MigrationDomain.MEDIA,
        sourceTable: params.sourceTable,
        sourceId: params.sourceId,
        reason: MIGRATION_REJECTION_REASON.NO_MEDIA_REFERENCE,
        jobId: params.jobId,
      });
      return null;
    }

    const extension =
      MIGRATION_MEDIA_CONTENT_TYPE_EXTENSION[resolved.contentType];
    if (!extension) {
      await this.idMapper.recordRejected({
        domain: MigrationDomain.MEDIA,
        sourceTable: params.sourceTable,
        sourceId: params.sourceId,
        reason: MIGRATION_REJECTION_REASON.MEDIA_NON_IMAGE_CONTENT_TYPE,
        jobId: params.jobId,
      });
      return null;
    }

    try {
      const media = await this.mediaService.upload({
        buffer: resolved.buffer,
        contentType: resolved.contentType,
        originalName: params.originalName,
        extension,
        keyPrefix: `${MIGRATION_MEDIA_KEY_PREFIX}/${params.keyPrefixSuffix}`,
      });
      await this.idMapper.recordSuccess({
        domain: MigrationDomain.MEDIA,
        sourceTable: params.sourceTable,
        sourceId: params.sourceId,
        targetTable: 'Media',
        targetId: media.id,
        jobId: params.jobId,
      });
      return media;
    } catch (error) {
      await this.idMapper.recordRejected({
        domain: MigrationDomain.MEDIA,
        sourceTable: params.sourceTable,
        sourceId: params.sourceId,
        reason: MIGRATION_REJECTION_REASON.MEDIA_UPLOAD_FAILED,
        jobId: params.jobId,
      });
      this.logger.warn(
        `Media upload failed for ${params.sourceTable}#${params.sourceId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private async resolveBytes(
    params: LegacyMediaTransferParams,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    if (params.legacyMediaId) {
      const legacyMedia = await this.legacyPrisma.legacyMedia.findUnique({
        where: { id: params.legacyMediaId },
      });
      if (legacyMedia) {
        if (legacyMedia.source === LegacyStorageSource.MINIO) {
          const object = await withTimeout(
            this.legacyMediaStagingClient.getObject(legacyMedia.fileKey),
            MIGRATION_NETWORK_TIMEOUT_MS,
            'Timed out reading legacy media from the staging bucket.',
          );
          return { buffer: object.buffer, contentType: object.contentType };
        }
        if (legacyMedia.source === LegacyStorageSource.CLOUDINARY) {
          return this.fetchUrl(
            this.buildLegacyCloudinaryUrl(legacyMedia.fileKey),
          );
        }
        // S3/DIGITAL_OCEAN sources were never observed in scope for this
        // migration (see the plan's research) — fall through to the
        // plain-string fallback below rather than special-casing them.
      }
    }

    if (params.legacyPlainUrl) {
      return this.fetchUrl(params.legacyPlainUrl);
    }

    return null;
  }

  private buildLegacyCloudinaryUrl(fileKey: string): string {
    const cloudName = this.appConfig.legacyCloudinaryCloudName;
    if (!cloudName) {
      throw new Error(
        'LEGACY_CLOUDINARY_CLOUD_NAME is not configured — cannot resolve a Cloudinary-sourced legacy Media row.',
      );
    }
    return `https://res.cloudinary.com/${cloudName}/image/upload/${fileKey}`;
  }

  private async fetchUrl(
    url: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const response = await withTimeout(
      fetch(url),
      MIGRATION_NETWORK_TIMEOUT_MS,
      `Timed out fetching legacy media at ${url}.`,
    );
    if (!response.ok) {
      throw new Error(
        `Legacy media URL returned HTTP ${response.status}: ${url}`,
      );
    }
    const contentType = response.headers.get('content-type') ?? '';
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, contentType };
  }
}
