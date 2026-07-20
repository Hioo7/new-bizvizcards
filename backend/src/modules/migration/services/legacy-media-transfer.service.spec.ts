import { LegacyMediaTransferService } from './legacy-media-transfer.service';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import type { AppConfigService } from '../../../common/config/app-config.service';
import type { LegacyPrismaService } from '../../../common/legacy-db/legacy-prisma.service';
import type { MediaService } from '../../../common/media/media.service';
import type { LegacyMediaStagingClient } from './legacy-media-staging-client.service';
import type { LegacyIdMapperService } from './legacy-id-mapper.service';

function baseParams(
  overrides?: Partial<Parameters<LegacyMediaTransferService['transfer']>[0]>,
) {
  return {
    legacyMediaId: null,
    legacyPlainUrl: null,
    sourceTable: 'ECard.imageUrl',
    sourceId: 'legacy-ecard-1',
    keyPrefixSuffix: 'legacy-ecard-1',
    jobId: 'job-1',
    originalName: 'profile.jpg',
    ...overrides,
  };
}

function createService(overrides: {
  findExisting?: () => Promise<unknown>;
  legacyMediaFindUnique?: () => Promise<unknown>;
  getObject?: () => Promise<{ buffer: Buffer; contentType: string }>;
  uploadResult?: { id: string };
  cloudName?: string;
}) {
  const recordSuccess = jest.fn().mockResolvedValue(undefined);
  const recordRejected = jest.fn().mockResolvedValue(undefined);
  const recordSkipped = jest.fn().mockResolvedValue(undefined);
  const touchExistingSuccess = jest.fn().mockResolvedValue(undefined);
  const idMapper = {
    findExisting: overrides.findExisting ?? jest.fn().mockResolvedValue(null),
    recordSuccess,
    recordRejected,
    recordSkipped,
    touchExistingSuccess,
  } as unknown as LegacyIdMapperService;

  const upload = jest
    .fn()
    .mockResolvedValue(overrides.uploadResult ?? { id: 'media-1' });
  const mediaService = { upload } as unknown as MediaService;

  const prisma = {
    media: { findUnique: jest.fn().mockResolvedValue({ id: 'media-1' }) },
  } as unknown as PrismaService;

  const legacyPrisma = {
    legacyMedia: {
      findUnique:
        overrides.legacyMediaFindUnique ?? jest.fn().mockResolvedValue(null),
    },
  } as unknown as LegacyPrismaService;

  const appConfig = {
    legacyCloudinaryCloudName: overrides.cloudName,
  } as unknown as AppConfigService;

  const legacyMediaStagingClient = {
    getObject:
      overrides.getObject ??
      jest.fn().mockRejectedValue(new Error('not configured')),
  } as unknown as LegacyMediaStagingClient;

  return {
    service: new LegacyMediaTransferService(
      prisma,
      legacyPrisma,
      appConfig,
      mediaService,
      legacyMediaStagingClient,
      idMapper,
    ),
    upload,
    recordSuccess,
    recordRejected,
    recordSkipped,
    touchExistingSuccess,
  };
}

describe('LegacyMediaTransferService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns the existing Media row and skips reprocessing when a prior SUCCESS record exists', async () => {
    const { service, upload, touchExistingSuccess } = createService({
      findExisting: jest.fn().mockResolvedValue({
        status: 'SUCCESS',
        targetId: 'media-existing',
      }),
    });

    const media = await service.transfer(baseParams());

    expect(media).toEqual({ id: 'media-1' });
    expect(upload).not.toHaveBeenCalled();
    expect(touchExistingSuccess).toHaveBeenCalledWith(
      'MEDIA',
      'ECard.imageUrl',
      'legacy-ecard-1',
      'job-1',
    );
  });

  it('skips as NO_MEDIA_REFERENCE when neither a legacy mediaId nor a plain URL is present', async () => {
    const { service, upload, recordSkipped } = createService({});

    const media = await service.transfer(baseParams());

    expect(media).toBeNull();
    expect(upload).not.toHaveBeenCalled();
    expect(recordSkipped).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'NO_MEDIA_REFERENCE' }),
    );
  });

  it('fetches the plain-string fallback URL, uploads it, and records success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
    });
    const { service, upload, recordSuccess } = createService({});

    const media = await service.transfer(
      baseParams({ legacyPlainUrl: 'https://res.cloudinary.com/demo/x.jpg' }),
    );

    expect(media).toEqual({ id: 'media-1' });
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/jpeg', extension: 'jpg' }),
    );
    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ targetTable: 'Media', targetId: 'media-1' }),
    );
  });

  it('rejects as MEDIA_URL_UNREACHABLE and returns null (non-fatal) when the fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    const { service, recordRejected } = createService({});

    const media = await service.transfer(
      baseParams({
        legacyPlainUrl: 'https://res.cloudinary.com/demo/missing.jpg',
      }),
    );

    expect(media).toBeNull();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'MEDIA_URL_UNREACHABLE' }),
    );
  });

  it('rejects as MEDIA_NON_IMAGE_CONTENT_TYPE when the fetched content type is not a whitelisted image type', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/pdf' }),
      arrayBuffer: () => Promise.resolve(new Uint8Array([1]).buffer),
    });
    const { service, upload, recordRejected } = createService({});

    const media = await service.transfer(
      baseParams({ legacyPlainUrl: 'https://res.cloudinary.com/demo/x.pdf' }),
    );

    expect(media).toBeNull();
    expect(upload).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'MEDIA_NON_IMAGE_CONTENT_TYPE' }),
    );
  });

  it('reads from the staging client for a MINIO-sourced legacy Media row', async () => {
    const getObject = jest.fn().mockResolvedValue({
      buffer: Buffer.from([1, 2]),
      contentType: 'image/png',
    });
    const { service, upload, recordSuccess } = createService({
      legacyMediaFindUnique: jest.fn().mockResolvedValue({
        id: 'legacy-media-1',
        fileKey: 'user_pfp/1/profile',
        source: 'MINIO',
      }),
      getObject,
    });

    const media = await service.transfer(
      baseParams({ legacyMediaId: 'legacy-media-1' }),
    );

    expect(getObject).toHaveBeenCalledWith('user_pfp/1/profile');
    expect(media).toEqual({ id: 'media-1' });
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/png', extension: 'png' }),
    );
    expect(recordSuccess).toHaveBeenCalled();
  });

  it('reconstructs the Cloudinary URL for a CLOUDINARY-sourced legacy Media row and fetches it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/webp' }),
      arrayBuffer: () => Promise.resolve(new Uint8Array([1]).buffer),
    });
    const { service, upload } = createService({
      legacyMediaFindUnique: jest.fn().mockResolvedValue({
        id: 'legacy-media-1',
        fileKey: 'templates/founder-1',
        source: 'CLOUDINARY',
      }),
      cloudName: 'demo-cloud',
    });

    const media = await service.transfer(
      baseParams({ legacyMediaId: 'legacy-media-1' }),
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'https://res.cloudinary.com/demo-cloud/image/upload/templates/founder-1',
    );
    expect(media).toEqual({ id: 'media-1' });
    expect(upload).toHaveBeenCalled();
  });
});
