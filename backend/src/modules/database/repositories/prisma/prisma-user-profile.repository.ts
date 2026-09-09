/**
 * WebOS Backend - Prisma UserProfile Repository
 */

import { AbstractRepository } from '../../../../repositories/base.repository.js';
import type { QueryOptions } from '../../../../repositories/query.types.js';
import type { IUserProfileRepository, UserProfileEntity } from '../../database.types.js';
import type { IPrismaClient } from '../../prisma.types.js';

export class PrismaUserProfileRepository
  extends AbstractRepository<UserProfileEntity, string, unknown>
  implements IUserProfileRepository
{
  private readonly prisma: IPrismaClient;

  constructor(prisma: IPrismaClient) {
    super('UserProfile');
    this.prisma = prisma;
  }

  public async findById(id: string): Promise<UserProfileEntity | null> {
    const record = await this.prisma.userProfile.findUnique({ where: { id } });
    return record ? this.mapToEntity(record) : null;
  }

  public async findByUserId(userId: string): Promise<UserProfileEntity | null> {
    const record = await this.prisma.userProfile.findUnique({ where: { userId } });
    return record ? this.mapToEntity(record) : null;
  }

  public async exists(id: string): Promise<boolean> {
    const count = await this.prisma.userProfile.count({ where: { id } });
    return count > 0;
  }

  public async count(): Promise<number> {
    return this.prisma.userProfile.count();
  }

  public async findMany(
    options?: QueryOptions<UserProfileEntity>
  ): Promise<readonly UserProfileEntity[]> {
    const records = await this.prisma.userProfile.findMany({
      skip: options?.pagination?.offset,
      take: options?.pagination?.limit
    });
    return records.map((r: any) => this.mapToEntity(r));
  }

  public async create(
    entity: Omit<UserProfileEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserProfileEntity> {
    const record = await this.prisma.userProfile.create({
      data: {
        userId: entity.userId,
        displayName: entity.displayName,
        avatarUrl: entity.avatarUrl,
        bio: entity.bio,
        locale: entity.locale,
        theme: entity.theme,
        wallpaper: entity.wallpaper,
        desktopLayout: entity.desktopLayout as any,
        notificationPreferences: entity.notificationPreferences as any
      }
    });
    return this.mapToEntity(record);
  }

  public async update(
    id: string,
    patch: Partial<UserProfileEntity>
  ): Promise<UserProfileEntity> {
    const record = await this.prisma.userProfile.update({
      where: { id },
      data: {
        ...(patch.displayName !== undefined && { displayName: patch.displayName }),
        ...(patch.avatarUrl !== undefined && { avatarUrl: patch.avatarUrl }),
        ...(patch.bio !== undefined && { bio: patch.bio }),
        ...(patch.locale !== undefined && { locale: patch.locale }),
        ...(patch.theme !== undefined && { theme: patch.theme }),
        ...(patch.wallpaper !== undefined && { wallpaper: patch.wallpaper }),
        ...(patch.desktopLayout !== undefined && {
          desktopLayout: patch.desktopLayout as any
        }),
        ...(patch.notificationPreferences !== undefined && {
          notificationPreferences: patch.notificationPreferences as any
        })
      }
    });
    return this.mapToEntity(record);
  }

  public async updateByUserId(
    userId: string,
    patch: Partial<UserProfileEntity>
  ): Promise<UserProfileEntity> {
    const record = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...(patch.displayName !== undefined && { displayName: patch.displayName }),
        ...(patch.avatarUrl !== undefined && { avatarUrl: patch.avatarUrl }),
        ...(patch.bio !== undefined && { bio: patch.bio }),
        ...(patch.locale !== undefined && { locale: patch.locale }),
        ...(patch.theme !== undefined && { theme: patch.theme }),
        ...(patch.wallpaper !== undefined && { wallpaper: patch.wallpaper }),
        ...(patch.desktopLayout !== undefined && {
          desktopLayout: patch.desktopLayout as any
        }),
        ...(patch.notificationPreferences !== undefined && {
          notificationPreferences: patch.notificationPreferences as any
        })
      }
    });
    return this.mapToEntity(record);
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.userProfile.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  public async deleteByUserId(userId: string): Promise<boolean> {
    try {
      await this.prisma.userProfile.delete({ where: { userId } });
      return true;
    } catch {
      return false;
    }
  }

  private mapToEntity(record: any): UserProfileEntity {
    return {
      id: record.id,
      userId: record.userId,
      displayName: record.displayName,
      avatarUrl: record.avatarUrl,
      bio: record.bio,
      locale: record.locale,
      theme: record.theme,
      wallpaper: record.wallpaper,
      desktopLayout: (record.desktopLayout as Record<string, unknown>) ?? {},
      notificationPreferences:
        (record.notificationPreferences as Record<string, unknown>) ?? {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
