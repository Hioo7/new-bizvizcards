import { Module } from '@nestjs/common';
import { LegacyPrismaService } from './legacy-prisma.service';

// Not @Global(), unlike PrismaModule — the legacy DB client is only ever
// needed by the migration module (src/modules/migration), so it's imported
// explicitly there rather than injected into every module app-wide.
@Module({
  providers: [LegacyPrismaService],
  exports: [LegacyPrismaService],
})
export class LegacyDbModule {}
