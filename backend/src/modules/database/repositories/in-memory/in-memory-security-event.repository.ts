/**
 * WebOS Backend - In-Memory SecurityEvent Repository
 */

import type {
  ISecurityEventRepository,
  SecurityEventEntity,
  SecurityEventFilterCriteria
} from '../../database.types.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemorySecurityEventRepository implements ISecurityEventRepository {
  private readonly store = new Map<string, SecurityEventEntity>();

  public async recordEvent(
    data: Omit<SecurityEventEntity, 'id' | 'occurredAt'>
  ): Promise<SecurityEventEntity> {
    const id = IdUtils.generateUuid();
    const entity: SecurityEventEntity = {
      ...data,
      id,
      occurredAt: new Date()
    };
    this.store.set(id, entity);
    return { ...entity };
  }

  public async findRecentByUserId(
    userId: string,
    limit = 20
  ): Promise<readonly SecurityEventEntity[]> {
    const results: SecurityEventEntity[] = [];
    for (const e of this.store.values()) {
      if (e.userId === userId) {
        results.push({ ...e });
      }
    }
    results.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
    return results.slice(0, limit);
  }

  public async count(filter?: SecurityEventFilterCriteria): Promise<number> {
    const items = await this.applyFilter(filter);
    return items.length;
  }

  public async findMany(
    options?: QueryOptions<SecurityEventEntity>
  ): Promise<readonly SecurityEventEntity[]> {
    let items = await this.applyFilter(options?.filter as SecurityEventFilterCriteria | undefined);

    if (options?.sort) {
      const sortEntries = Object.entries(options.sort);
      if (sortEntries.length > 0) {
        const [field, order] = sortEntries[0] as [keyof SecurityEventEntity, 'asc' | 'desc'];
        items.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;
          const comp = valA < valB ? -1 : 1;
          return order === 'desc' ? -comp : comp;
        });
      }
    } else {
      items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
    }

    if (options?.pagination) {
      const page = Math.max(1, options.pagination.page ?? 1);
      const limit = Math.max(1, Math.min(100, options.pagination.limit ?? 20));
      const offset = options.pagination.offset ?? (page - 1) * limit;
      items = items.slice(offset, offset + limit);
    }

    return items.map((e) => ({ ...e }));
  }

  public clear(): void {
    this.store.clear();
  }

  private async applyFilter(filter?: SecurityEventFilterCriteria): Promise<SecurityEventEntity[]> {
    let items = Array.from(this.store.values());
    if (!filter) return items;

    if (filter.userId) {
      items = items.filter((e) => e.userId === filter.userId);
    }
    if (filter.eventType) {
      items = items.filter((e) => e.eventType === filter.eventType);
    }
    if (filter.severity) {
      items = items.filter((e) => e.severity === filter.severity);
    }
    if (filter.since) {
      items = items.filter((e) => e.occurredAt >= filter.since!);
    }
    if (filter.until) {
      items = items.filter((e) => e.occurredAt <= filter.until!);
    }

    return items;
  }
}
