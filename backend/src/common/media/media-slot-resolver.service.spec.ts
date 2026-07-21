import { MediaSlotResolverService } from './media-slot-resolver.service';
import type { MediaService } from './media.service';

function makeFile(fieldname: string): Express.Multer.File {
  return {
    fieldname,
    originalname: 'test.png',
    mimetype: 'image/png',
    buffer: Buffer.from('fake-bytes'),
    size: 10,
  } as Express.Multer.File;
}

describe('MediaSlotResolverService', () => {
  function createResolver(uploadedMediaId = 'uploaded-media-1') {
    const upload = jest.fn().mockResolvedValue({ id: uploadedMediaId });
    const mediaService = { upload } as unknown as MediaService;
    return { resolver: new MediaSlotResolverService(mediaService), upload };
  }

  describe('buildFileMap', () => {
    it('indexes files by fieldname', () => {
      const { resolver } = createResolver();
      const file = makeFile('hero-photo');

      const map = resolver.buildFileMap([file]);

      expect(map.get('hero-photo')).toBe(file);
    });
  });

  describe('resolveUploadSlot', () => {
    it('returns undefined when the slot is undefined (field omitted)', async () => {
      const { resolver } = createResolver();

      const result = await resolver.resolveUploadSlot(
        undefined,
        'hero-photo',
        new Map(),
        'ecard/1/hero',
      );

      expect(result).toBeUndefined();
    });

    it('uploads the matching file and returns the new media id', async () => {
      const { resolver, upload } = createResolver('new-media-1');
      const fileMap = resolver.buildFileMap([makeFile('hero-photo')]);

      const result = await resolver.resolveUploadSlot(
        { action: 'upload' },
        'hero-photo',
        fileMap,
        'ecard/1/hero',
      );

      expect(result).toBe('new-media-1');
      expect(upload).toHaveBeenCalledWith(
        expect.objectContaining({
          keyPrefix: 'ecard/1/hero',
          extension: 'png',
        }),
      );
    });

    it('throws when the slot requests an upload but no matching file was sent', async () => {
      const { resolver } = createResolver();

      await expect(
        resolver.resolveUploadSlot(
          { action: 'upload' },
          'hero-photo',
          new Map(),
          'ecard/1/hero',
        ),
      ).rejects.toThrow('Missing uploaded file for field "hero-photo"');
    });
  });

  describe('resolveUpdateSlot', () => {
    it('returns undefined when the slot is undefined (field omitted)', async () => {
      const { resolver } = createResolver();

      const result = await resolver.resolveUpdateSlot(
        undefined,
        'hero-photo',
        new Map(),
        'ecard/1/hero',
        new Set(),
      );

      expect(result).toBeUndefined();
    });

    it('keeps an existing mediaId when it belongs to the resource', async () => {
      const { resolver } = createResolver();

      const result = await resolver.resolveUpdateSlot(
        { action: 'keep', mediaId: 'existing-media-1' },
        'hero-photo',
        new Map(),
        'ecard/1/hero',
        new Set(['existing-media-1']),
      );

      expect(result).toBe('existing-media-1');
    });

    it('rejects a "keep" slot referencing a mediaId that does not belong to this resource', async () => {
      const { resolver } = createResolver();

      await expect(
        resolver.resolveUpdateSlot(
          { action: 'keep', mediaId: 'someone-elses-media' },
          'hero-photo',
          new Map(),
          'ecard/1/hero',
          new Set(['existing-media-1']),
        ),
      ).rejects.toThrow('mediaId does not belong to this resource');
    });

    it('uploads a new file when the slot requests an upload', async () => {
      const { resolver, upload } = createResolver('new-media-2');
      const fileMap = resolver.buildFileMap([makeFile('hero-photo')]);

      const result = await resolver.resolveUpdateSlot(
        { action: 'upload' },
        'hero-photo',
        fileMap,
        'ecard/1/hero',
        new Set(),
      );

      expect(result).toBe('new-media-2');
      expect(upload).toHaveBeenCalled();
    });
  });
});
