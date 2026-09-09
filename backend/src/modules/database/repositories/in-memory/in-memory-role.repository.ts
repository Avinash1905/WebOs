/**
 * WebOS Backend - In-Memory Role Repository
 */

import { AbstractRepository } from '../../../../repositories/base.repository.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import type { IRoleRepository, RoleEntity, RoleFilterCriteria, IUserRoleRepository } from '../../database.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemoryRoleRepository
  extends AbstractRepository<RoleEntity, string, RoleFilterCriteria>
  implements IRoleRepository
{
  private readonly store = new Map<string, RoleEntity>();
  private userRoleRepo: IUserRoleRepository | null = null;

  constructor(initialRoles: readonly RoleEntity[] = []) {
    super('Role');
    for (const r of initialRoles) {
      this.store.set(r.id, { ...r });
    }
  }

  public setUserRoleRepository(repo: IUserRoleRepository): void {
    this.userRoleRepo = repo;
  }

  public async findById(id: string): Promise<RoleEntity | null> {
    const role = this.store.get(id);
    return role ? { ...role } : null;
  }

  public async findByName(name: string): Promise<RoleEntity | null> {
    const normalized = name.toUpperCase();
    for (const role of this.store.values()) {
      if (role.name.toUpperCase() === normalized) {
        return { ...role };
      }
    }
    return null;
  }

  public async exists(id: string): Promise<boolean> {
    return this.store.has(id);
  }

  public async existsByName(name: string): Promise<boolean> {
    return (await this.findByName(name)) !== null;
  }

  public async count(filter?: RoleFilterCriteria): Promise<number> {
    const matches = await this.applyFilter(filter);
    return matches.length;
  }

  public async findMany(options?: QueryOptions<RoleEntity>): Promise<readonly RoleEntity[]> {
    let items = await this.applyFilter(options?.filter as RoleFilterCriteria | undefined);

    if (options?.sort) {
      const sortEntries = Object.entries(options.sort);
      if (sortEntries.length > 0) {
        const [field, order] = sortEntries[0] as [keyof RoleEntity, 'asc' | 'desc'];
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
    }

    if (options?.pagination) {
      const page = Math.max(1, options.pagination.page ?? 1);
      const limit = Math.max(1, Math.min(100, options.pagination.limit ?? 20));
      const offset = options.pagination.offset ?? (page - 1) * limit;
      items = items.slice(offset, offset + limit);
    }

    return items.map((r) => ({ ...r }));
  }

  public async create(data: Omit<RoleEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoleEntity> {
    const id = IdUtils.generateUuid();
    const now = new Date();
    const entity: RoleEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.store.set(id, entity);
    return { ...entity };
  }

  public async update(id: string, patch: Partial<RoleEntity>): Promise<RoleEntity> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Role with ID ${id} not found`);
    }
    const updated: RoleEntity = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date()
    };
    this.store.set(id, updated);
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  public async findByUserId(userId: string): Promise<readonly RoleEntity[]> {
    if (!this.userRoleRepo) {
      return [];
    }
    const assignments = await this.userRoleRepo.findByUserId(userId);
    const roles: RoleEntity[] = [];
    for (const a of assignments) {
      const role = await this.findById(a.roleId);
      if (role) {
        roles.push(role);
      }
    }
    return roles;
  }

  public clear(): void {
    this.store.clear();
  }

  private async applyFilter(filter?: RoleFilterCriteria): Promise<RoleEntity[]> {
    let items = Array.from(this.store.values());
    if (!filter) return items;

    if (filter.name) {
      const q = filter.name.toUpperCase();
      items = items.filter((r) => r.name.toUpperCase().includes(q));
    }
    if (filter.isSystem !== undefined) {
      items = items.filter((r) => r.isSystem === filter.isSystem);
    }
    if (filter.minHierarchyLevel !== undefined) {
      items = items.filter((r) => r.hierarchyLevel >= filter.minHierarchyLevel!);
    }
    if (filter.maxHierarchyLevel !== undefined) {
      items = items.filter((r) => r.hierarchyLevel <= filter.maxHierarchyLevel!);
    }

    return items;
  }
}
