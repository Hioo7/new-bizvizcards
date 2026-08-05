// Standalone script (dev tooling, not app runtime) — uploads the small,
// fixed set of social-platform brand icon images used inline in generated
// email signature HTML to the well-known storage keys every
// EmailSignaturesService instance resolves via
// MediaService.getPublicUrlForKey(). Not tied to any Media DB row — these
// are static assets, seeded once, safe to re-run. Mirrors
// seed-og-preview-image.ts's approach exactly.
// Run via `npm run seed:email-signature-icons`.
import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { AppConfigService } from '../../src/common/config/app-config.service';
import { MinioMediaStorageProvider } from '../../src/common/media/storage/minio-media-storage-provider.service';
import { EmailSignatureSocialPlatform } from '../../src/generated/prisma/client';
import { EMAIL_SIGNATURE_SOCIAL_ICON_STORAGE_KEY } from '../../src/modules/email-signatures/email-signatures.constants';

const ASSETS_DIR = join(__dirname, '..', 'assets', 'email-signature-icons');

async function main() {
  const appConfig = new AppConfigService();
  const provider = new MinioMediaStorageProvider(appConfig);
  await provider.onModuleInit();

  const platforms = Object.values(EmailSignatureSocialPlatform).filter(
    (platform) => platform !== EmailSignatureSocialPlatform.CUSTOM,
  );

  for (const platform of platforms) {
    const storageKey = EMAIL_SIGNATURE_SOCIAL_ICON_STORAGE_KEY[platform];
    if (!storageKey) {
      continue;
    }
    const fileName = storageKey.split('/').pop()!;
    const sourcePath = join(ASSETS_DIR, fileName);
    if (!existsSync(sourcePath)) {
      throw new Error(
        `No icon found for ${platform} at ${sourcePath}. Add a ~40x40 PNG brand icon at that path, then re-run this script.`,
      );
    }
    await provider.upload({
      key: storageKey,
      buffer: readFileSync(sourcePath),
      contentType: 'image/png',
    });
    console.log(`Seeded ${platform} icon at "${storageKey}".`);
  }
}

main().catch((error: unknown) => {
  console.error('Seeding email signature icons failed:', error);
  process.exitCode = 1;
});
