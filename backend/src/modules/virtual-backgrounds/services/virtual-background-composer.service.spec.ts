import sharp from 'sharp';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { VirtualBackgroundQrCorner } from '../../../generated/prisma/client';
import { VirtualBackgroundComposerService } from './virtual-background-composer.service';
import {
  VIRTUAL_BACKGROUND_CORNER_MARGIN_PX,
  VIRTUAL_BACKGROUND_HEIGHT_PX,
  VIRTUAL_BACKGROUND_WIDTH_PX,
} from '../virtual-backgrounds.constants';

const SAMPLE_INSET_PX = VIRTUAL_BACKGROUND_CORNER_MARGIN_PX + 10;

// Happy paths:
// - exactly-sized base image composes into a 1920x1080 PNG
// - an oversized base image is center-cropped ("cover") to exactly 1920x1080
// - each of the four corners places a white legibility card near that corner
// - a caption renders without throwing and without changing output dimensions
// Sad paths:
// - a base image narrower than 1920px is rejected
// - a base image shorter than 1080px is rejected

async function solidImageBuffer(
  width: number,
  height: number,
  background: { r: number; g: number; b: number },
): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background },
  })
    .png()
    .toBuffer();
}

describe('VirtualBackgroundComposerService', () => {
  const service = new VirtualBackgroundComposerService();
  const RED = { r: 255, g: 0, b: 0 };

  it('composes an exactly-sized base image into a 1920x1080 PNG', async () => {
    const base = await solidImageBuffer(
      VIRTUAL_BACKGROUND_WIDTH_PX,
      VIRTUAL_BACKGROUND_HEIGHT_PX,
      RED,
    );

    const result = await service.compose({
      baseImageBuffer: base,
      ecardUrl: 'https://example.com/ecard/jane-doe',
      qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
      captionText: null,
    });

    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(VIRTUAL_BACKGROUND_WIDTH_PX);
    expect(metadata.height).toBe(VIRTUAL_BACKGROUND_HEIGHT_PX);
  });

  it('center-crops an oversized base image down to exactly 1920x1080', async () => {
    const base = await solidImageBuffer(
      VIRTUAL_BACKGROUND_WIDTH_PX * 2,
      VIRTUAL_BACKGROUND_HEIGHT_PX * 2,
      RED,
    );

    const result = await service.compose({
      baseImageBuffer: base,
      ecardUrl: 'https://example.com/ecard/jane-doe',
      qrCorner: VirtualBackgroundQrCorner.TOP_LEFT,
      captionText: null,
    });

    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(VIRTUAL_BACKGROUND_WIDTH_PX);
    expect(metadata.height).toBe(VIRTUAL_BACKGROUND_HEIGHT_PX);
  });

  it('renders a caption without throwing or changing output dimensions', async () => {
    const base = await solidImageBuffer(
      VIRTUAL_BACKGROUND_WIDTH_PX,
      VIRTUAL_BACKGROUND_HEIGHT_PX,
      RED,
    );

    const result = await service.compose({
      baseImageBuffer: base,
      ecardUrl: 'https://example.com/ecard/jane-doe',
      qrCorner: VirtualBackgroundQrCorner.BOTTOM_LEFT,
      captionText: 'Scan to save my contact',
    });

    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(VIRTUAL_BACKGROUND_WIDTH_PX);
    expect(metadata.height).toBe(VIRTUAL_BACKGROUND_HEIGHT_PX);
  });

  it.each([
    [VirtualBackgroundQrCorner.TOP_LEFT, SAMPLE_INSET_PX, SAMPLE_INSET_PX],
    [
      VirtualBackgroundQrCorner.TOP_RIGHT,
      VIRTUAL_BACKGROUND_WIDTH_PX - SAMPLE_INSET_PX,
      SAMPLE_INSET_PX,
    ],
    [
      VirtualBackgroundQrCorner.BOTTOM_LEFT,
      SAMPLE_INSET_PX,
      VIRTUAL_BACKGROUND_HEIGHT_PX - SAMPLE_INSET_PX,
    ],
    [
      VirtualBackgroundQrCorner.BOTTOM_RIGHT,
      VIRTUAL_BACKGROUND_WIDTH_PX - SAMPLE_INSET_PX,
      VIRTUAL_BACKGROUND_HEIGHT_PX - SAMPLE_INSET_PX,
    ],
  ])(
    'places a white legibility card near the %s corner',
    async (corner, sampleX, sampleY) => {
      const base = await solidImageBuffer(
        VIRTUAL_BACKGROUND_WIDTH_PX,
        VIRTUAL_BACKGROUND_HEIGHT_PX,
        RED,
      );

      const result = await service.compose({
        baseImageBuffer: base,
        ecardUrl: 'https://example.com/ecard/jane-doe',
        qrCorner: corner,
        captionText: null,
      });

      const { data, info } = await sharp(result)
        .raw()
        .toBuffer({ resolveWithObject: true });
      const pixelIndex = (sampleY * info.width + sampleX) * info.channels;
      const [r, g, b] = [
        data[pixelIndex],
        data[pixelIndex + 1],
        data[pixelIndex + 2],
      ];

      // Sampled just inside the corner margin, over the white card — should
      // no longer be the original solid-red background.
      expect(r).toBeGreaterThan(200);
      expect(g).toBeGreaterThan(200);
      expect(b).toBeGreaterThan(200);
    },
  );

  it('leaves the far corner untouched (still the original background color)', async () => {
    const base = await solidImageBuffer(
      VIRTUAL_BACKGROUND_WIDTH_PX,
      VIRTUAL_BACKGROUND_HEIGHT_PX,
      RED,
    );

    const result = await service.compose({
      baseImageBuffer: base,
      ecardUrl: 'https://example.com/ecard/jane-doe',
      qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
      captionText: null,
    });

    const { data, info } = await sharp(result)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixelIndex = (10 * info.width + 10) * info.channels;
    const [r, g, b] = [
      data[pixelIndex],
      data[pixelIndex + 1],
      data[pixelIndex + 2],
    ];

    expect(r).toBeGreaterThan(200);
    expect(g).toBeLessThan(50);
    expect(b).toBeLessThan(50);
  });

  it('rejects a base image narrower than 1920px', async () => {
    const base = await solidImageBuffer(
      VIRTUAL_BACKGROUND_WIDTH_PX - 1,
      VIRTUAL_BACKGROUND_HEIGHT_PX,
      RED,
    );

    await expect(
      service.compose({
        baseImageBuffer: base,
        ecardUrl: 'https://example.com/ecard/jane-doe',
        qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
        captionText: null,
      }),
    ).rejects.toThrow(UnsupportedMediaTypeException);
  });

  it('rejects a base image shorter than 1080px', async () => {
    const base = await solidImageBuffer(
      VIRTUAL_BACKGROUND_WIDTH_PX,
      VIRTUAL_BACKGROUND_HEIGHT_PX - 1,
      RED,
    );

    await expect(
      service.compose({
        baseImageBuffer: base,
        ecardUrl: 'https://example.com/ecard/jane-doe',
        qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
        captionText: null,
      }),
    ).rejects.toThrow(UnsupportedMediaTypeException);
  });
});
