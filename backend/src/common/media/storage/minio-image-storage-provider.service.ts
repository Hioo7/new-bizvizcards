import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { AppConfigService } from '../../config/app-config.service';
import { MEDIA_PUBLIC_PATH_PREFIX } from '../media.constants';
import {
  ImageStorageProvider,
  UploadImageParams,
} from './image-storage-provider.interface';

@Injectable()
export class MinioImageStorageProvider implements ImageStorageProvider {
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

  async upload({ key, buffer, contentType }: UploadImageParams): Promise<void> {
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
