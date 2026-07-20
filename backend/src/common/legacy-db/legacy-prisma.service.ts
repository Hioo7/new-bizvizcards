import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/legacy-prisma/client';
import { AppConfigService } from '../config/app-config.service';

// Unlike PrismaService (the main app datasource), LEGACY_DATABASE_URL is
// optional and normally unset outside of an active migration run — so this
// deliberately does NOT eagerly $connect() in an OnModuleInit hook the way
// PrismaService does. Eagerly connecting would make every app boot depend on
// a legacy DB tunnel that only exists during a migration window. Prisma
// connects lazily on first query instead, so an unset/unreachable
// LEGACY_DATABASE_URL only ever surfaces as a failed pre-flight check
// (MigrationPreflightService) or migrator call, never as an app boot failure.
@Injectable()
export class LegacyPrismaService
  extends PrismaClient
  implements OnModuleDestroy
{
  constructor(appConfig: AppConfigService) {
    const connectionString = appConfig.legacyDatabaseUrl;
    // @prisma/adapter-pg hands the connection string straight to `pg.Pool`,
    // which — unlike Prisma's own query engine — does not parse a `?schema=`
    // query param itself; without this, every connection silently falls
    // back to Postgres's default `search_path` ("public"). Harmless
    // everywhere else in this app (every other DATABASE_URL already targets
    // "public", so the fallback and the intended value are identical) but
    // not for this one, since a read-only legacy connection may need to
    // target a distinct schema/namespace (e.g. the migration pipeline's own
    // test fixtures live in a "legacy_test" schema, not "public").
    const schema = connectionString
      ? (new URL(connectionString).searchParams.get('schema') ?? undefined)
      : undefined;

    super({
      adapter: new PrismaPg(
        { connectionString },
        schema ? { schema } : undefined,
      ),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
