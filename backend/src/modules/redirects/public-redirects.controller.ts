import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { resolveRedirectQuerySchema } from './dto/resolve-redirect-query.dto';
import type { ResolveRedirectQueryDto } from './dto/resolve-redirect-query.dto';
import { REDIRECT_HTTP_STATUS } from './redirects.constants';
import { RedirectResolverService } from './services/redirect-resolver.service';

@Controller('api/public/redirects')
export class PublicRedirectsController {
  constructor(
    private readonly redirectResolverService: RedirectResolverService,
  ) {}

  @Get('resolve')
  async resolve(
    @Query(new ZodValidationPipe(resolveRedirectQuerySchema))
    query: ResolveRedirectQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.redirectResolverService.resolve(query.path);
    if (!result) {
      res.status(HttpStatus.NOT_FOUND).end();
      return;
    }
    res.redirect(REDIRECT_HTTP_STATUS, result.target);
  }
}
