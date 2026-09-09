/**
 * WebOS Backend - Security Event Recorder
 * Centralized audit logging for security, identity, and authorization events.
 */

import type {
  ISecurityEventRepository,
  SecuritySeverity,
  SecurityEventEntity
} from '../../database/database.types.js';
import type { ILogger } from '../../../common/logging/logger.types.js';

export interface SecurityEventOptions {
  userId?: string | null;
  eventType: string;
  severity?: SecuritySeverity;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export class SecurityEventRecorder {
  private readonly repo: ISecurityEventRepository;
  private readonly logger: ILogger;

  constructor(repo: ISecurityEventRepository, logger: ILogger) {
    this.repo = repo;
    this.logger = logger.child({ component: 'SecurityAudit' });
  }

  public async record(options: SecurityEventOptions): Promise<SecurityEventEntity> {
    const severity = options.severity ?? 'INFO';
    const userAgent = options.userAgent ?? 'unknown';

    const entity = await this.repo.recordEvent({
      userId: options.userId ?? null,
      eventType: options.eventType,
      severity,
      ipAddress: options.ipAddress,
      userAgent,
      metadata: options.metadata ?? null
    });

    const logPayload = {
      auditEventId: entity.id,
      eventType: entity.eventType,
      severity,
      userId: entity.userId,
      ipAddress: entity.ipAddress
    };

    if (severity === 'SECURITY_ALERT' || severity === 'CRITICAL') {
      this.logger.error(logPayload, `[SECURITY AUDIT] ${entity.eventType} - ${severity}`);
    } else if (severity === 'WARN') {
      this.logger.warn(logPayload, `[SECURITY AUDIT] ${entity.eventType}`);
    } else {
      this.logger.info(logPayload, `[SECURITY AUDIT] ${entity.eventType}`);
    }

    return entity;
  }
}
