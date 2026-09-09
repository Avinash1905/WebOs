/**
 * WebOS Backend - Module 6: Session Management Types and DTOs
 */

import type { SessionStatus } from '../database/database.types.js';

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';

export interface DeviceInfo {
  readonly deviceType: DeviceType;
  readonly browser: string;
  readonly browserVersion: string | null;
  readonly os: string;
  readonly osVersion: string | null;
  readonly cpuArchitecture: string | null;
}

export interface SessionDeviceDto {
  id: string;
  deviceType: string;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  cpuArchitecture: string | null;
  clientIdentifier: string | null;
}

export interface SessionDto {
  id: string;
  userId: string;
  status: SessionStatus;
  ipAddress: string;
  isCurrent: boolean;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
  device: SessionDeviceDto | null;
}

export interface SessionPolicyConfig {
  readonly maxLifetimeMs: number; // default 7 days
  readonly slidingWindowInactivityMs: number; // default 30 minutes
  readonly maxConcurrentSessionsPerUser: number; // default 10
  readonly touchThrottleMs: number; // default 60 seconds
}
