/**
 * @file types.ts
 * @description Type definitions for the WebOS System Diagnostics Subsystem.
 */

import type { EventBus } from '../events/index.js';
import type { Kernel } from '../kernel/index.js';
import type { StorageEngine } from '../storage/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { TrashManager } from '../trash/index.js';
import type { UserManager } from '../users/index.js';
import type { PermissionManager } from '../permissions/index.js';
import type { ProcessManager } from '../process/index.js';
import type { Scheduler } from '../scheduler/index.js';
import type { Shell } from '../shell/index.js';
import type { ApplicationRuntime } from '../apps/index.js';
import type { SearchEngine } from '../search/index.js';
import type { ClipboardManager } from '../clipboard/index.js';
import type { ServiceManager } from '../services/index.js';
import type { ResourceManager } from '../resources/index.js';

export type DiagnosticStatus = 'PASS' | 'WARNING' | 'FAIL' | 'UNKNOWN';

export type DiagnosticSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SystemOverallHealth = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export interface DiagnosticCheck {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly severity: DiagnosticSeverity;
  run(): Promise<DiagnosticResult> | DiagnosticResult;
}

export interface DiagnosticResult {
  readonly checkId: string;
  readonly name: string;
  readonly category: string;
  readonly severity: DiagnosticSeverity;
  readonly status: DiagnosticStatus;
  readonly timestamp: number;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly recommendation?: string;
}

export interface DiagnosticReport {
  readonly reportId: string;
  readonly timestamp: number;
  readonly durationMs: number;
  readonly overallHealth: SystemOverallHealth;
  readonly totalChecks: number;
  readonly passedCount: number;
  readonly warningCount: number;
  readonly failCount: number;
  readonly unknownCount: number;
  readonly results: readonly DiagnosticResult[];
  readonly summary: string;
}

export interface TrackedError {
  readonly id: string;
  readonly subsystem: string;
  readonly code: string;
  readonly message: string;
  readonly severity: DiagnosticSeverity;
  readonly timestamp: number;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface DiagnosticsConfig {
  readonly maxErrorHistory?: number;
  readonly maxReportHistory?: number;
  readonly eventBus?: EventBus;
}

export interface DiagnosticsDependencies {
  readonly kernel?: Kernel;
  readonly eventBus?: EventBus;
  readonly storage?: StorageEngine;
  readonly filesystem?: FileSystem;
  readonly trashManager?: TrashManager;
  readonly userManager?: UserManager;
  readonly permissionManager?: PermissionManager;
  readonly processManager?: ProcessManager;
  readonly scheduler?: Scheduler;
  readonly shell?: Shell;
  readonly appRuntime?: ApplicationRuntime;
  readonly searchEngine?: SearchEngine;
  readonly clipboardManager?: ClipboardManager;
  readonly serviceManager?: ServiceManager;
  readonly resourceManager?: ResourceManager;
}
