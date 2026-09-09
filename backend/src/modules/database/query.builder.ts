/**
 * WebOS Backend - Query Criteria Builder
 * Translates domain filter criteria into Prisma query objects.
 */

import type {
  UserFilterCriteria,
  RoleFilterCriteria,
  PermissionFilterCriteria,
  SessionFilterCriteria,
  SecurityEventFilterCriteria
} from './database.types.js';

export class QueryBuilder {
  public static buildUserWhere(criteria?: UserFilterCriteria): Record<string, unknown> {
    if (!criteria) return {};

    const where: Record<string, unknown> = {};

    if (criteria.status) {
      where.status = criteria.status;
    }
    if (criteria.emailVerified !== undefined) {
      where.emailVerified = criteria.emailVerified;
    }
    if (criteria.username) {
      where.username = { contains: criteria.username, mode: 'insensitive' };
    }
    if (criteria.email) {
      where.email = { contains: criteria.email, mode: 'insensitive' };
    }
    if (criteria.search) {
      where.OR = [
        { username: { contains: criteria.search, mode: 'insensitive' } },
        { email: { contains: criteria.search, mode: 'insensitive' } }
      ];
    }
    if (criteria.createdAfter || criteria.createdBefore) {
      const createdAt: Record<string, Date> = {};
      if (criteria.createdAfter) createdAt.gte = criteria.createdAfter;
      if (criteria.createdBefore) createdAt.lte = criteria.createdBefore;
      where.createdAt = createdAt;
    }

    return where;
  }

  public static buildRoleWhere(criteria?: RoleFilterCriteria): Record<string, unknown> {
    if (!criteria) return {};

    const where: Record<string, unknown> = {};

    if (criteria.name) {
      where.name = { contains: criteria.name, mode: 'insensitive' };
    }
    if (criteria.isSystem !== undefined) {
      where.isSystem = criteria.isSystem;
    }
    if (criteria.minHierarchyLevel !== undefined || criteria.maxHierarchyLevel !== undefined) {
      const level: Record<string, number> = {};
      if (criteria.minHierarchyLevel !== undefined) level.gte = criteria.minHierarchyLevel;
      if (criteria.maxHierarchyLevel !== undefined) level.lte = criteria.maxHierarchyLevel;
      where.hierarchyLevel = level;
    }

    return where;
  }

  public static buildPermissionWhere(criteria?: PermissionFilterCriteria): Record<string, unknown> {
    if (!criteria) return {};

    const where: Record<string, unknown> = {};

    if (criteria.resource) where.resource = criteria.resource;
    if (criteria.action) where.action = criteria.action;
    if (criteria.name) where.name = { contains: criteria.name, mode: 'insensitive' };

    return where;
  }

  public static buildSessionWhere(criteria?: SessionFilterCriteria): Record<string, unknown> {
    if (!criteria) return {};

    const where: Record<string, unknown> = {};

    if (criteria.userId) where.userId = criteria.userId;
    if (criteria.status) where.status = criteria.status;
    if (criteria.ipAddress) where.ipAddress = criteria.ipAddress;
    if (criteria.activeOnly) {
      where.status = 'ACTIVE';
      where.expiresAt = { gt: new Date() };
    }

    return where;
  }

  public static buildSecurityEventWhere(criteria?: SecurityEventFilterCriteria): Record<string, unknown> {
    if (!criteria) return {};

    const where: Record<string, unknown> = {};

    if (criteria.userId) where.userId = criteria.userId;
    if (criteria.eventType) where.eventType = criteria.eventType;
    if (criteria.severity) where.severity = criteria.severity;
    if (criteria.since || criteria.until) {
      const occurredAt: Record<string, Date> = {};
      if (criteria.since) occurredAt.gte = criteria.since;
      if (criteria.until) occurredAt.lte = criteria.until;
      where.occurredAt = occurredAt;
    }

    return where;
  }
}
