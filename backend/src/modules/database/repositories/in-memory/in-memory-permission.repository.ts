/**
 * WebOS Backend - In-Memory Permission Repository
 */

import { AbstractRepository } from '../../../../repositories/base.repository.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import type {
  IPermissionRepository,
  PermissionEntity,
  PermissionFilterCriteria,
  IRolePermissionRepository,
  IUserRoleRepository,
  UserRoleEntity
} from '../../database.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemoryPermissionRepository
  extends AbstractRepository<PermissionEntity, string, PermissionFilterCriteria>
  implements IPermissionRepository
{
  private readonly store = new Map<string, PermissionEntity>();
  private rolePermissionRepo: IRolePermissionRepository | null = null;
  private userRoleRepo: IUserRoleRepository | null = null;

  constructor(initialPermissions: readonly PermissionEntity[] = []) {
    super('Permission');
    for (const p of initialPermissions) {
      this.store.set(p.id, { ...p });
    }
  }

  public setDependencies(
    rolePermissionRepo: IRolePermissionRepository,
    userRoleRepo: IUserRoleRepository
  ): void {
    this.rolePermissionRepo = rolePermissionRepo;
    this.userRoleRepo = userRoleRepo;
  }

  public async findById(id: string): Promise<PermissionEntity | null> {
    const perm = this.store.get(id);
    return perm ? { ...perm } : null;
  }

  public async findByName(name: string): Promise<PermissionEntity | null> {
    const normalized = name.toLowerCase();
    for (const perm of this.store.values()) {
      if (perm.name.toLowerCase() === normalized) {
        return { ...perm };
      }
    }
    return null;
  }

  public async findByResourceAndAction(
    resource: string,
    action: string
  ): Promise<PermissionEntity | null> {
    const rNorm = resource.toLowerCase();
    const aNorm = action.toLowerCase();
    for (const perm of this.store.values()) {
      if (perm.resource.toLowerCase() === rNorm && perm.action.toLowerCase() === aNorm) {
        return { ...perm };
      }
    }
    return null;
  }

  public async exists(id: string): Promise<boolean> {
    return this.store.has(id);
  }

  public async count(filter?: PermissionFilterCriteria): Promise<number> {
    const items = await this.applyFilter(filter);
    return items.length;
  }

  public async findMany(
    options?: QueryOptions<PermissionEntity>
  ): Promise<readonly PermissionEntity[]> {
    let items = await this.applyFilter(options?.filter as PermissionFilterCriteria | undefined);

    if (options?.sort) {
      const sortEntries = Object.entries(options.sort);
      if (sortEntries.length > 0) {
        const [field, order] = sortEntries[0] as [keyof PermissionEntity, 'asc' | 'desc'];
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

    return items.map((p) => ({ ...p }));
  }

  public async create(
    data: Omit<PermissionEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PermissionEntity> {
    const id = IdUtils.generateUuid();
    const now = new Date();
    const entity: PermissionEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.store.set(id, entity);
    return { ...entity };
  }

  public async update(id: string, patch: Partial<PermissionEntity>): Promise<PermissionEntity> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Permission with ID ${id} not found`);
    }
    const updated: PermissionEntity = {
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

  public async findByRoleId(roleId: string): Promise<readonly PermissionEntity[]> {
    if (!this.rolePermissionRepo) return [];
    const grants = await this.rolePermissionRepo.findByRoleId(roleId);
    const perms: PermissionEntity[] = [];
    for (const g of grants) {
      const p = await this.findById(g.permissionId);
      if (p) perms.push(p);
    }
    return perms;
  }

  public async findByRoleIds(roleIds: readonly string[]): Promise<readonly PermissionEntity[]> {
    const seen = new Set<string>();
    const results: PermissionEntity[] = [];
    for (const roleId of roleIds) {
      const perms = await this.findByRoleId(roleId);
      for (const p of perms) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          results.push(p);
        }
      }
    }
    return results;
  }

  public async findByUserId(userId: string): Promise<readonly PermissionEntity[]> {
    if (!this.userRoleRepo) return [];
    const userRoles = await this.userRoleRepo.findByUserId(userId);
    const roleIds = userRoles.map((ur: UserRoleEntity) => ur.roleId);
    return this.findByRoleIds(roleIds);
  }

  public clear(): void {
    this.store.clear();
  }

  private async applyFilter(filter?: PermissionFilterCriteria): Promise<PermissionEntity[]> {
    let items = Array.from(this.store.values());
    if (!filter) return items;

    if (filter.resource) {
      const r = filter.resource.toLowerCase();
      items = items.filter((p) => p.resource.toLowerCase() === r);
    }
    if (filter.action) {
      const a = filter.action.toLowerCase();
      items = items.filter((p) => p.action.toLowerCase() === a);
    }
    if (filter.name) {
      const n = filter.name.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(n));
    }

    return items;
  }
}
