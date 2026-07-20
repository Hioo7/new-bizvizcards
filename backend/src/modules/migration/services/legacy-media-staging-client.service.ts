import { Injectable } from '@nestjs/common';
import {
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { AppConfigService } from '../../../common/config/app-config.service';

export interface LegacyStagingObject {
  buffer: Buffer;
  contentType: string;
}

// Reads from the staging bucket that the one-time `mc mirror` bulk copy
// (Phase A of the media transfer strategy) writes legacy MinIO-backed media
// objects into — same MinIO instance/credentials as the app's own
// MinioMediaStorageProvider, just a different bucket name. Used by both
// MigrationPreflightService (reachability check) and
// LegacyMediaTransferService (actual object reads).
@Injectable()
export class LegacyMediaStagingClient {
  private readonly client: S3Client;
  readonly bucket: string | undefined;

  constructor(appConfig: AppConfigService) {
    this.bucket = appConfig.legacyMediaStagingBucket;
    this.client = new S3Client({
      endpoint: appConfig.minioEndpoint,
      region: appConfig.minioRegion,
      forcePathStyle: true,
      credentials: {
        accessKeyId: appConfig.minioAccessKeyId,
        secretAccessKey: appConfig.minioSecretAccessKey,
      },
    });
  }

  // Throws if the bucket is unset, unreachable, or missing — callers decide
  // how to surface that (a failed pre-flight check, a rejected/skipped
  // MigrationRecord, etc.), this never swallows the error itself.
  async checkReachable(): Promise<{ objectCount: number }> {
    if (!this.bucket) {
      throw new Error('LEGACY_MEDIA_STAGING_BUCKET is not configured');
    }
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    const listing = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1 }),
    );
    return { objectCount: listing.KeyCount ?? 0 };
  }

  async getObject(key: string): Promise<LegacyStagingObject> {
    if (!this.bucket) {
      throw new Error('LEGACY_MEDIA_STAGING_BUCKET is not configured');
    }
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const buffer = Buffer.from(await result.Body!.transformToByteArray());
    return {
      buffer,
      contentType: result.ContentType ?? 'application/octet-stream',
    };
  }
}
