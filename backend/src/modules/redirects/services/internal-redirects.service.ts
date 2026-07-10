import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { InternalRedirectRouteModel } from '../../../generated/prisma/models';
import type { CreateInternalRedirectDto } from '../dto/create-internal-redirect.dto';
import type { UpdateInternalRedirectDto } from '../dto/update-internal-redirect.dto';
import { RestrictedPathsService } from './restricted-paths.service';

@Injectable()
export class InternalRedirectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly restrictedPaths: RestrictedPathsService,
  ) {}

  list(): Promise<InternalRedirectRouteModel[]> {
    return this.prisma.internalRedirectRoute.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<InternalRedirectRouteModel> {
    const route = await this.prisma.internalRedirectRoute.findUnique({
      where: { id },
    });
    if (!route) {
      throw new NotFoundException('Internal redirect not found');
    }
    return route;
  }

  async create(
    dto: CreateInternalRedirectDto,
    actorAccountId: string,
  ): Promise<InternalRedirectRouteModel> {
    await this.restrictedPaths.assertNotRestricted(dto.sourcePath);
    await this.assertSourcePathAvailable(dto.sourcePath);

    // actorAccountId is the EmployeeAccount id (better-auth's own identity),
    // not the Employee business-row id that createdByEmployeeId references —
    // resolve it the same way SmartCardsService resolves its actor.
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { accountId: actorAccountId },
    });

    return this.prisma.internalRedirectRoute.create({
      data: {
        sourcePath: dto.sourcePath,
        targetPath: dto.targetPath,
        enabled: dto.enabled ?? true,
        createdByEmployeeId: employee.id,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateInternalRedirectDto,
  ): Promise<InternalRedirectRouteModel> {
    await this.getById(id);

    if (dto.sourcePath !== undefined) {
      await this.restrictedPaths.assertNotRestricted(dto.sourcePath);
      await this.assertSourcePathAvailable(dto.sourcePath, id);
    }

    return this.prisma.internalRedirectRoute.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.prisma.internalRedirectRoute.delete({ where: { id } });
  }

  private async assertSourcePathAvailable(
    sourcePath: string,
    excludingId?: string,
  ): Promise<void> {
    const existing = await this.prisma.internalRedirectRoute.findUnique({
      where: { sourcePath },
    });
    if (existing && existing.id !== excludingId) {
      throw new ConflictException(
        'An internal redirect for this source path already exists',
      );
    }
  }
}
