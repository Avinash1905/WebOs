/**
 * WebOS Backend - In-Memory SessionDevice Repository
 */

import type { ISessionDeviceRepository, SessionDeviceEntity } from '../../database.types.js';
import { IdUtils } from '../../../../common/utils/id.js';

export class InMemorySessionDeviceRepository implements ISessionDeviceRepository {
  private readonly store = new Map<string, SessionDeviceEntity>();

  public async findById(id: string): Promise<SessionDeviceEntity | null> {
    const d = this.store.get(id);
    return d ? { ...d } : null;
  }

  public async findBySessionId(sessionId: string): Promise<SessionDeviceEntity | null> {
    for (const d of this.store.values()) {
      if (d.sessionId === sessionId) {
        return { ...d };
      }
    }
    return null;
  }

  public async create(
    data: Omit<SessionDeviceEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SessionDeviceEntity> {
    const id = IdUtils.generateUuid();
    const now = new Date();
    const entity: SessionDeviceEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.store.set(id, entity);
    return { ...entity };
  }

  public async update(id: string, patch: Partial<SessionDeviceEntity>): Promise<SessionDeviceEntity> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Device info with ID ${id} not found`);
    }
    const updated: SessionDeviceEntity = {
      ...existing,
      ...patch,
      id: existing.id,
      sessionId: existing.sessionId,
      updatedAt: new Date()
    };
    this.store.set(id, updated);
    return { ...updated };
  }

  public async deleteBySessionId(sessionId: string): Promise<boolean> {
    for (const [id, d] of this.store.entries()) {
      if (d.sessionId === sessionId) {
        return this.store.delete(id);
      }
    }
    return false;
  }

  public clear(): void {
    this.store.clear();
  }
}
