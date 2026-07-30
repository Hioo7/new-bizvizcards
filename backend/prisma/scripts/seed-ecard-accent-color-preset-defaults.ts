// Standalone script (dev tooling, not app runtime) — backfills the default
// accent-color presets onto every existing EcardPolicy row (this feature is
// a retrofit: every plan currently has zero presets). Idempotent: only acts
// on EcardPolicy rows that have zero accentColorPresets already, so re-running
// this script never duplicates presets on a policy an admin has since edited.
// Run via `npm run seed:ecard-accent-color-preset-defaults`, once, after
// applying the migration that introduces EcardAccentColorPreset.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { DEFAULT_ECARD_ACCENT_COLOR_PRESETS } from '../../src/modules/ecards/ecards.constants';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const ecardPolicies = await prisma.ecardPolicy.findMany({
    where: { accentColorPresets: { none: {} } },
    select: { id: true },
  });

  if (ecardPolicies.length === 0) {
    console.log(
      'No EcardPolicy rows are missing accent-color presets; skipping.',
    );
    return;
  }

  for (const ecardPolicy of ecardPolicies) {
    await prisma.ecardAccentColorPreset.createMany({
      data: DEFAULT_ECARD_ACCENT_COLOR_PRESETS.map((preset, order) => ({
        ecardPolicyId: ecardPolicy.id,
        themeAffinity: preset.themeAffinity,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        order,
      })),
    });
  }

  console.log(
    `Backfilled default accent-color presets for ${ecardPolicies.length} EcardPolicy row(s).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Backfilling accent-color preset defaults failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
