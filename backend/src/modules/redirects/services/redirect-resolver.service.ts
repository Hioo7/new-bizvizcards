import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { normalizeRedirectPath } from '../redirects.constants';

export interface ResolvedRedirect {
  type: 'internal' | 'external';
  target: string;
}

@Injectable()
export class RedirectResolverService {
  private readonly logger = new Logger(RedirectResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ports the legacy proxy.ts resolution order and fail-open behavior:
   * internal redirects are checked before external ones, and any DB error
   * is treated as "no match" rather than blocking the request.
   */
  async resolve(path: string): Promise<ResolvedRedirect | null> {
    const normalized = normalizeRedirectPath(path);

    try {
      const internal = await this.prisma.internalRedirectRoute.findUnique({
        where: { sourcePath: normalized, enabled: true },
        select: { targetPath: true },
      });
      if (internal) {
        return { type: 'internal', target: internal.targetPath };
      }

      const external = await this.prisma.externalRedirectRoute.findUnique({
        where: { sourcePath: normalized, enabled: true },
        select: { destinationUrl: true },
      });
      if (external) {
        return { type: 'external', target: external.destinationUrl };
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `Redirect resolution failed for path "${normalized}", falling through`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }
}
