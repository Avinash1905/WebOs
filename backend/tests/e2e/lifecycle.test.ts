/**
 * WebOS Backend Foundation - Server Lifecycle & Graceful Shutdown E2E Test
 */

import { describe, it, expect } from 'vitest';
import { startServer } from '../../src/server/server.js';
import { parseConfig } from '../../src/common/config/config.schema.js';

describe('Server Lifecycle & Graceful Shutdown E2E', () => {
  it('should start network server on dynamic port, serve live HTTP traffic, and shut down gracefully', async () => {
    const hookHistory: string[] = [];

    const config = parseConfig({
      NODE_ENV: 'test',
      HOST: '127.0.0.1',
      PORT: '0', // OS assigns free ephemeral port
      LOG_LEVEL: 'fatal'
    });

    const running = await startServer({
      config,
      shutdownOptions: {
        timeoutMs: 5000,
        exitOnComplete: false // Do not terminate test runner process
      }
    });

    // Register lifecycle verification hooks
    running.lifecycle.onBeforeStart(() => {
      hookHistory.push('beforeStart');
    });
    running.lifecycle.onAfterStart(() => {
      hookHistory.push('afterStart');
    });
    running.lifecycle.onBeforeShutdown(() => {
      hookHistory.push('beforeShutdown');
    });
    running.lifecycle.onAfterShutdown(() => {
      hookHistory.push('afterShutdown');
    });

    expect(running.address).toBeDefined();
    expect(running.port).toBeGreaterThan(0);

    // Make live HTTP request over the real network socket
    const url = `http://127.0.0.1:${running.port}/health`;
    const response = await fetch(url);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; service: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('webos-backend');

    // Trigger graceful shutdown
    await running.shutdown.shutdown('e2e_test_completion');
    running.shutdown.detachSignalHandlers();

    expect(running.shutdown.getIsShuttingDown()).toBe(true);
    expect(hookHistory).toContain('beforeShutdown');
    expect(hookHistory).toContain('afterShutdown');
  });
});
