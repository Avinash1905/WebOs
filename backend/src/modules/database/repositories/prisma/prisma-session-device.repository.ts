/**
 * WebOS Backend - Prisma SessionDevice Repository
 */

import type { ISessionDeviceRepository, SessionDeviceEntity } from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';

export class PrismaSessionDeviceRepository implements ISessionDeviceRepository {
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    this.prisma = prisma;
  }

  public async findById(id: string): Promise<SessionDeviceEntity | null> {
    const record = await this.prisma.sessionDevice.findUnique({ where: { id } });
    return record ? this.mapToEntity(record) : null;
  }

  public async findBySessionId(sessionId: string): Promise<SessionDeviceEntity | null> {
    const record = await this.prisma.sessionDevice.findUnique({ where: { sessionId } });
    return record ? this.mapToEntity(record) : null;
  }

  public async create(
    entity: Omit<SessionDeviceEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SessionDeviceEntity> {
    const record = await this.prisma.sessionDevice.create({
      data: {
        sessionId: entity.sessionId,
        deviceType: entity.deviceType,
        browser: entity.browser,
        browserVersion: entity.browserVersion,
        os: entity.os,
        osVersion: entity.osVersion,
        cpuArchitecture: entity.cpuArchitecture,
        clientIdentifier: entity.clientIdentifier
      }
    });
    return this.mapToEntity(record);
  }

  public async update(
    id: string,
    patch: Partial<SessionDeviceEntity>
  ): Promise<SessionDeviceEntity> {
    const record = await this.prisma.sessionDevice.update({
      where: { id },
      data: {
        ...(patch.deviceType !== undefined && { deviceType: patch.deviceType }),
        ...(patch.browser !== undefined && { browser: patch.browser }),
        ...(patch.browserVersion !== undefined && { browserVersion: patch.browserVersion }),
        ...(patch.os !== undefined && { os: patch.os }),
        ...(patch.osVersion !== undefined && { osVersion: patch.osVersion }),
        ...(patch.cpuArchitecture !== undefined && { cpuArchitecture: patch.cpuArchitecture }),
        ...(patch.clientIdentifier !== undefined && { clientIdentifier: patch.clientIdentifier })
      }
    });
    return this.mapToEntity(record);
  }

  public async deleteBySessionId(sessionId: string): Promise<boolean> {
    try {
      await this.prisma.sessionDevice.deleteMany({ where: { sessionId } });
      return true;
    } catch {
      return false;
    }
  }

  private mapToEntity(record: any): SessionDeviceEntity {
    return {
      id: record.id,
      sessionId: record.sessionId,
      deviceType: record.deviceType,
      browser: record.browser,
      browserVersion: record.browserVersion,
      os: record.os,
      osVersion: record.osVersion,
      cpuArchitecture: record.cpuArchitecture,
      clientIdentifier: record.clientIdentifier,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
