import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MigrationJob,
  MigrationRecord,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { ListMigrationJobsQueryDto } from '../dto/list-migration-jobs-query.dto';
import type { ListMigrationRecordsQueryDto } from '../dto/list-migration-records-query.dto';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Read-only queries backing the polling UI — separate from
// MigrationOrchestratorService, which owns the job's write-side lifecycle.
@Injectable()
export class MigrationJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: ListMigrationJobsQueryDto,
  ): Promise<PaginatedResult<MigrationJob>> {
    const { page, pageSize } = query;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.migrationJob.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.migrationJob.count(),
    ]);
    return { items, total, page, pageSize };
  }

  async getByIdOrThrow(id: string): Promise<MigrationJob> {
    const job = await this.prisma.migrationJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Migration job not found');
    }
    return job;
  }

  async listRecords(
    jobId: string,
    query: ListMigrationRecordsQueryDto,
  ): Promise<PaginatedResult<MigrationRecord>> {
    await this.getByIdOrThrow(jobId);

    const { domain, status, reason, page, pageSize } = query;
    const where = {
      lastProcessedJobId: jobId,
      ...(domain ? { domain } : {}),
      ...(status ? { status } : {}),
      ...(reason
        ? { reason: { contains: reason, mode: 'insensitive' as const } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.migrationRecord.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.migrationRecord.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}
