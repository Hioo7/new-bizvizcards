import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { RestrictedRedirectPathModel } from '../../../generated/prisma/models';
import type { CreateRestrictedPathDto } from '../dto/create-restricted-path.dto';

@Injectable()
export class RestrictedPathsService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<RestrictedRedirectPathModel[]> {
    return this.prisma.restrictedRedirectPath.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    dto: CreateRestrictedPathDto,
  ): Promise<RestrictedRedirectPathModel> {
    const existing = await this.prisma.restrictedRedirectPath.findUnique({
      where: { path: dto.path },
    });
    if (existing) {
      throw new ConflictException('Restricted path already exists');
    }
    return this.prisma.restrictedRedirectPath.create({
      data: { path: dto.path },
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.restrictedRedirectPath.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Restricted path not found');
    }
    await this.prisma.restrictedRedirectPath.delete({ where: { id } });
  }

  /** Throws when the given path is on the blocklist — checked for both internal and external redirect sources. */
  async assertNotRestricted(path: string): Promise<void> {
    const restricted = await this.prisma.restrictedRedirectPath.findUnique({
      where: { path },
    });
    if (restricted) {
      throw new BadRequestException(
        'This path is restricted and cannot be used as a redirect source',
      );
    }
  }
}
