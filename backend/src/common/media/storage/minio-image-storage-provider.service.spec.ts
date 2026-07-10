import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { AppConfigService } from '../../config/app-config.service';
import { buildPublicReadBucketPolicy } from '../media.constants';
import { MinioImageStorageProvider } from './minio-image-storage-provider.service';

function createAppConfig(): AppConfigService {
  return {
    minioBucket: 'test-bucket',
    minioEndpoint: 'http://localhost:9000',
    minioRegion: 'us-east-1',
    minioAccessKeyId: 'access-key',
    minioSecretAccessKey: 'secret-key',
  } as unknown as AppConfigService;
}

describe('MinioImageStorageProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uploads an object with the given key, buffer, and content type', async () => {
    const sendSpy = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    const provider = new MinioImageStorageProvider(createAppConfig());

    await provider.upload({
      key: 'pfp/customer-1/abc.jpg',
      buffer: Buffer.from('data'),
      contentType: 'image/jpeg',
    });

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const command = sendSpy.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'pfp/customer-1/abc.jpg',
      Body: Buffer.from('data'),
      ContentType: 'image/jpeg',
    });
  });

  it('deletes an object by key', async () => {
    const sendSpy = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    const provider = new MinioImageStorageProvider(createAppConfig());

    await provider.delete('pfp/customer-1/abc.jpg');

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const command = sendSpy.mock.calls[0][0] as DeleteObjectCommand;
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'pfp/customer-1/abc.jpg',
    });
  });

  it('builds a public URL from the bucket and key, with no network call', () => {
    const provider = new MinioImageStorageProvider(createAppConfig());

    const url = provider.getPublicUrl('pfp/customer-1/abc.jpg');

    expect(url).toBe('/media/test-bucket/pfp/customer-1/abc.jpg');
  });

  describe('onModuleInit', () => {
    it('applies the public-read policy without creating the bucket when it already exists', async () => {
      const sendSpy = jest
        .spyOn(S3Client.prototype, 'send')
        .mockResolvedValue({} as never);
      const provider = new MinioImageStorageProvider(createAppConfig());

      await provider.onModuleInit();

      expect(sendSpy).toHaveBeenCalledTimes(2);
      expect(sendSpy.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
      expect((sendSpy.mock.calls[0][0] as HeadBucketCommand).input).toEqual({
        Bucket: 'test-bucket',
      });
      expect(sendSpy.mock.calls[1][0]).toBeInstanceOf(PutBucketPolicyCommand);
      expect(
        (sendSpy.mock.calls[1][0] as PutBucketPolicyCommand).input,
      ).toEqual({
        Bucket: 'test-bucket',
        Policy: buildPublicReadBucketPolicy('test-bucket'),
      });
    });

    it('creates the bucket first when it does not exist yet, then applies the policy', async () => {
      const sendSpy = jest
        .spyOn(S3Client.prototype, 'send')
        .mockRejectedValueOnce(new Error('NotFound'))
        .mockResolvedValue({} as never);
      const provider = new MinioImageStorageProvider(createAppConfig());

      await provider.onModuleInit();

      expect(sendSpy).toHaveBeenCalledTimes(3);
      expect(sendSpy.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
      expect(sendSpy.mock.calls[1][0]).toBeInstanceOf(CreateBucketCommand);
      expect((sendSpy.mock.calls[1][0] as CreateBucketCommand).input).toEqual({
        Bucket: 'test-bucket',
      });
      expect(sendSpy.mock.calls[2][0]).toBeInstanceOf(PutBucketPolicyCommand);
    });
  });
});
