import { Module } from '@nestjs/common';
import { InternalRedirectsController } from './internal-redirects.controller';
import { ExternalRedirectsController } from './external-redirects.controller';
import { RestrictedPathsController } from './restricted-paths.controller';
import { PublicRedirectsController } from './public-redirects.controller';
import { InternalRedirectsService } from './services/internal-redirects.service';
import { ExternalRedirectsService } from './services/external-redirects.service';
import { RestrictedPathsService } from './services/restricted-paths.service';
import { RedirectResolverService } from './services/redirect-resolver.service';

@Module({
  controllers: [
    InternalRedirectsController,
    ExternalRedirectsController,
    RestrictedPathsController,
    PublicRedirectsController,
  ],
  providers: [
    InternalRedirectsService,
    ExternalRedirectsService,
    RestrictedPathsService,
    RedirectResolverService,
  ],
})
export class RedirectsModule {}
