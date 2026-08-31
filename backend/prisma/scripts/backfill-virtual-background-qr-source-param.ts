// One-off backfill (dev/ops tooling, not app runtime). Every virtual
// background created before the QR-attribution feature has a cached composed
// PNG whose QR points at a param-less e-card URL, so its scans can't be
// distinguished from any other view. This re-renders each one so the QR
// carries `?src=virtual-background&sref=<id>`.
//
// Safe to re-run: re-rendering produces the same image, and each row is
// repointed at its new composed media with the old one removed. Rows whose
// base image can no longer be resolved (template deleted) are skipped and
// logged. Run once, after the feature is deployed, via
// `npm run backfill:vb-qr-source`.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { VirtualBackgroundsService } from '../../src/modules/virtual-backgrounds/services/virtual-backgrounds.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const prisma = app.get(PrismaService);
    const virtualBackgroundsService = app.get(VirtualBackgroundsService);

    const ids = await prisma.virtualBackground.findMany({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`Recomposing ${ids.length} virtual background(s)…`);

    let recomposed = 0;
    let skipped = 0;
    for (const { id } of ids) {
      try {
        await virtualBackgroundsService.recomposeComposedImage(id);
        recomposed += 1;
      } catch (error) {
        skipped += 1;
        console.warn(
          `  skipped ${id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    console.log(`Done. Recomposed ${recomposed}, skipped ${skipped}.`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
