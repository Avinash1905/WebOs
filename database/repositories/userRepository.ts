/**
 * WebOS Database - User Repository Layer
 */

import { SQLQueryBuilder } from '../queryBuilder/queryBuilder';

export interface UserEntity {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  display_name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository {
  private inMemoryDb: Map<string, UserEntity> = new Map();

  constructor() {
    this.inMemoryDb.set('usr-admin-1', {
      id: 'usr-admin-1',
      username: 'admin',
      email: 'admin@webos.local',
      password_hash: 'sha_admin',
      role: 'admin',
      display_name: 'System Administrator',
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  public async findById(id: string): Promise<UserEntity | null> {
    void SQLQueryBuilder.table('users').select().where('id', '=', id).toSQL();
    // In production executes against pg client pool
    return this.inMemoryDb.get(id) || null;
  }

  public async findByUsername(username: string): Promise<UserEntity | null> {
    for (const u of this.inMemoryDb.values()) {
      if (u.username.toLowerCase() === username.toLowerCase()) return u;
    }
    return null;
  }

  public async create(user: Omit<UserEntity, 'created_at' | 'updated_at'>): Promise<UserEntity> {
    const fullUser: UserEntity = {
      ...user,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.inMemoryDb.set(fullUser.id, fullUser);
    return fullUser;
  }

  public async update(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    const existing = this.inMemoryDb.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date() };
    this.inMemoryDb.set(id, updated);
    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    return this.inMemoryDb.delete(id);
  }
}

export const userRepository = new UserRepository();
