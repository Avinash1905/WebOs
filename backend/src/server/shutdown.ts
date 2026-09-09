/**
 * WebOS Backend Foundation - Graceful Shutdown Manager
 */

import type { FastifyInstance } from 'fastify';
import type { ILogger } from '../common/logging/logger.types.js';
import type { LifecycleManager } from './lifecycle.js';

export interface ShutdownOptions {
  readonly timeoutMs?: number;
  readonly exitOnComplete?: boolean;
}

export class GracefulShutdownManager {
  private isShuttingDown = false;
  private readonly app: FastifyInstance;
  private readonly lifecycle: LifecycleManager;
  private readonly logger: ILogger;
  private readonly timeoutMs: number;
  private readonly exitOnComplete: boolean;
  private readonly boundHandlers: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];

  constructor(
    app: FastifyInstance,
    lifecycle: LifecycleManager,
    logger: ILogger,
    options: ShutdownOptions = {}
  ) {
    this.app = app;
    this.lifecycle = lifecycle;
    this.logger = logger.child({ subsystem: 'shutdown-manager' });
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.exitOnComplete = options.exitOnComplete ?? true;
  }

  public getIsShuttingDown(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Attach process signal and error listeners
   */
  public attachSignalHandlers(): void {
    const handleSignal = (signal: string) => {
      this.logger.info({ signal }, `Received ${signal}, initiating graceful shutdown...`);
      void this.shutdown(signal);
    };

    const sigintHandler = () => handleSignal('SIGINT');
    const sigtermHandler = () => handleSignal('SIGTERM');

    process.once('SIGINT', sigintHandler);
    process.once('SIGTERM', sigtermHandler);

    this.boundHandlers.push(
      { event: 'SIGINT', handler: sigintHandler },
      { event: 'SIGTERM', handler: sigtermHandler }
    );
  }

  /**
   * Detach signal listeners (useful for test teardown)
   */
  public detachSignalHandlers(): void {
    for (const { event, handler } of this.boundHandlers) {
      process.removeListener(event, handler);
    }
    this.boundHandlers.length = 0;
  }

  /**
   * Execute graceful shutdown sequence
   */
  public async shutdown(reason = 'manual'): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn({ reason }, 'Shutdown already in progress, ignoring duplicate trigger.');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info({ reason, timeoutMs: this.timeoutMs }, 'Beginning graceful shutdown sequence...');

    // Set emergency exit timer in case shutdown hangs
    let timeoutTimer: NodeJS.Timeout | null = null;
    if (this.exitOnComplete) {
      timeoutTimer = setTimeout(() => {
        this.logger.error({ timeoutMs: this.timeoutMs }, 'Graceful shutdown timed out, forcing exit!');
        process.exit(1);
      }, this.timeoutMs);
      timeoutTimer.unref();
    }

    try {
      // Phase 1: Pre-shutdown cleanup (e.g. stop background tasks, set readiness to down)
      await this.lifecycle.runPhase('beforeShutdown');

      // Phase 2: Close Fastify HTTP server (stop accepting new requests, drain in-flight)
      this.logger.debug('Closing Fastify server instance...');
      await this.app.close();
      this.logger.debug('Fastify server closed.');

      // Phase 3: Post-shutdown cleanup (e.g. close future DB connections, caches)
      await this.lifecycle.runPhase('afterShutdown');

      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }

      this.logger.info('Graceful shutdown completed successfully.');

      if (this.exitOnComplete) {
        process.exit(0);
      }
    } catch (err) {
      this.logger.error({ err }, 'Error occurred during graceful shutdown!');
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
      if (this.exitOnComplete) {
        process.exit(1);
      }
      throw err;
    }
  }
}
