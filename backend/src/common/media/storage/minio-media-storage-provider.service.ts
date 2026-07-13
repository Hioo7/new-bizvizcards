import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { AppConfigService } from '../../config/app-config.service';
import {
  MEDIA_PUBLIC_PATH_PREFIX,
  buildPublicReadBucketPolicy,
} from '../media.constants';
import {
  MediaStorageProvider,
  UploadMediaParams,
} from './media-storage-provider.interface';

@Injectable()
export class MinioMediaStorageProvider
  implements MediaStorageProvider, OnModuleInit
{
  private readonly logger = new Logger(MinioMediaStorageProvider.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(appConfig: AppConfigService) {
    this.bucket = appConfig.minioBucket;
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

  async onModuleInit(): Promise<void> {
    await this.ensureBucketReady();
  }

  /**
   * Idempotently ensures the bucket exists and is publicly readable.
   * Runs on every startup so a freshly provisioned MinIO instance (or a
   * bucket someone created without a policy) never silently 403s on GETs —
   * see buildPublicReadBucketPolicy for why this is needed at all.
   */
  private async ensureBucketReady(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }

    await this.client.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: buildPublicReadBucketPolicy(this.bucket),
      }),
    );

    this.logger.log(`MinIO bucket "${this.bucket}" ready (public-read).`);
  }

  async upload({ key, buffer, contentType }: UploadMediaParams): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getPublicUrl(key: string): string {
    return `${MEDIA_PUBLIC_PATH_PREFIX}/${this.bucket}/${key}`;
  }
}
