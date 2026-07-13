// Standalone script (dev tooling, not app runtime) — uploads the default
// Open Graph fallback image (shown in link previews for cards with no
// uploaded logo) to the well-known storage key every SmartCardOgPreviewService
// instance resolves via MediaService.getPublicUrlForKey(). Not tied to
// any Media DB row — it's a static asset, seeded once, safe to re-run.
// Run via `npm run seed:og-preview-image`.
import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { AppConfigService } from '../../src/common/config/app-config.service';
import { MinioMediaStorageProvider } from '../../src/common/media/storage/minio-media-storage-provider.service';
import { DEFAULT_OG_IMAGE_STORAGE_KEY } from '../../src/modules/smart-cards/smart-card-og-preview.constants';

const SOURCE_IMAGE_PATH = join(
  __dirname,
  '..',
  'assets',
  'og-preview-fallback.png',
);

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

async function main() {
  if (!existsSync(SOURCE_IMAGE_PATH)) {
    throw new Error(
      `No default OG image found at ${SOURCE_IMAGE_PATH}. ` +
        'Add a ~1200x630 PNG/JPG brand image at that path, then re-run this script.',
    );
  }

  const contentType = CONTENT_TYPE_BY_EXTENSION[extname(SOURCE_IMAGE_PATH)];
  if (!contentType) {
    throw new Error(
      `Unsupported image extension for ${SOURCE_IMAGE_PATH} — use .png or .jpg/.jpeg.`,
    );
  }

  const appConfig = new AppConfigService();
  const provider = new MinioMediaStorageProvider(appConfig);
  await provider.onModuleInit();

  await provider.upload({
    key: DEFAULT_OG_IMAGE_STORAGE_KEY,
    buffer: readFileSync(SOURCE_IMAGE_PATH),
    contentType,
  });

  console.log(`Seeded default OG preview image at "${DEFAULT_OG_IMAGE_STORAGE_KEY}".`);
}

main().catch((error: unknown) => {
  console.error('Seeding the default OG preview image failed:', error);
  process.exitCode = 1;
});
