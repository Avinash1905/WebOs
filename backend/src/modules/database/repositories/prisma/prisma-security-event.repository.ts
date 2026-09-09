/**
 * WebOS Backend - Prisma SecurityEvent Repository
 */

import type {
  ISecurityEventRepository,
  SecurityEventEntity,
  SecurityEventFilterCriteria
} from '../../database.types.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import type { IPrismaClient } from '../../prisma.types.js';
import { QueryBuilder } from '../../query.builder.js';

export class PrismaSecurityEventRepository implements ISecurityEventRepository {
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    this.prisma = prisma;
  }

  public async recordEvent(
    data: Omit<SecurityEventEntity, 'id' | 'occurredAt'>
  ): Promise<SecurityEventEntity> {
    const record = await this.prisma.securityEvent.create({
      data: {
        userId: data.userId ?? null,
        eventType: data.eventType,
        severity: data.severity,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata as any
      }
    });
    return this.mapToEntity(record);
  }

  public async findRecentByUserId(
    userId: string,
    limit = 20
  ): Promise<readonly SecurityEventEntity[]> {
    const records = await this.prisma.securityEvent.findMany({
      where: { userId },
      take: limit,
      orderBy: { occurredAt: 'desc' }
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  public async count(filter?: SecurityEventFilterCriteria): Promise<number> {
    const where = QueryBuilder.buildSecurityEventWhere(filter);
    return this.prisma.securityEvent.count({ where });
  }

  public async findMany(
    options?: QueryOptions<SecurityEventEntity>
  ): Promise<readonly SecurityEventEntity[]> {
    const where = QueryBuilder.buildSecurityEventWhere(
      options?.filter as SecurityEventFilterCriteria | undefined
    );
    let orderBy: Record<string, 'asc' | 'desc'> | undefined;
    if (options?.sort) {
      const entries = Object.entries(options.sort);
      if (entries.length > 0) {
        const [field, order] = entries[0] as [string, 'asc' | 'desc'];
        orderBy = { [field]: order };
      }
    } else {
      orderBy = { occurredAt: 'desc' };
    }

    const records = await this.prisma.securityEvent.findMany({
      where,
      skip: options?.pagination?.offset,
      take: options?.pagination?.limit,
      orderBy
    });

    return records.map((r: any) => this.mapToEntity(r));
  }

  private mapToEntity(record: any): SecurityEventEntity {
    return {
      id: record.id,
      userId: record.userId,
      eventType: record.eventType,
      severity: record.severity,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      metadata: (record.metadata as Record<string, unknown>) ?? null,
      occurredAt: record.occurredAt
    };
  }
}
