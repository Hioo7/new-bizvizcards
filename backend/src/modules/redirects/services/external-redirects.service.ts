import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { ExternalRedirectRouteModel } from '../../../generated/prisma/models';
import type { CreateExternalRedirectDto } from '../dto/create-external-redirect.dto';
import type { UpdateExternalRedirectDto } from '../dto/update-external-redirect.dto';
import { RestrictedPathsService } from './restricted-paths.service';

@Injectable()
export class ExternalRedirectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly restrictedPaths: RestrictedPathsService,
  ) {}

  list(): Promise<ExternalRedirectRouteModel[]> {
    return this.prisma.externalRedirectRoute.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<ExternalRedirectRouteModel> {
    const route = await this.prisma.externalRedirectRoute.findUnique({
      where: { id },
    });
    if (!route) {
      throw new NotFoundException('External redirect not found');
    }
    return route;
  }

  async create(
    dto: CreateExternalRedirectDto,
    actorAccountId: string,
  ): Promise<ExternalRedirectRouteModel> {
    await this.restrictedPaths.assertNotRestricted(dto.sourcePath);
    await this.assertSourcePathAvailable(dto.sourcePath);

    // actorAccountId is the EmployeeAccount id (better-auth's own identity),
    // not the Employee business-row id that createdByEmployeeId references —
    // resolve it the same way SmartCardsService resolves its actor.
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { accountId: actorAccountId },
    });

    return this.prisma.externalRedirectRoute.create({
      data: {
        sourcePath: dto.sourcePath,
        destinationUrl: dto.destinationUrl,
        enabled: dto.enabled ?? true,
        createdByEmployeeId: employee.id,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateExternalRedirectDto,
  ): Promise<ExternalRedirectRouteModel> {
    await this.getById(id);

    if (dto.sourcePath !== undefined) {
      await this.restrictedPaths.assertNotRestricted(dto.sourcePath);
      await this.assertSourcePathAvailable(dto.sourcePath, id);
    }

    return this.prisma.externalRedirectRoute.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.prisma.externalRedirectRoute.delete({ where: { id } });
  }

  private async assertSourcePathAvailable(
    sourcePath: string,
    excludingId?: string,
  ): Promise<void> {
    const existing = await this.prisma.externalRedirectRoute.findUnique({
      where: { sourcePath },
    });
    if (existing && existing.id !== excludingId) {
      throw new ConflictException(
        'An external redirect for this source path already exists',
      );
    }
  }
}
