/**
 * WebOS Backend Foundation - Server Startup & Network Listener
 */

import type { FastifyInstance } from 'fastify';
import { createApp, type AppFactoryOptions } from './app.js';
import { loadConfig, type AppConfig } from './config.js';
import { LifecycleManager } from './lifecycle.js';
import { GracefulShutdownManager, type ShutdownOptions } from './shutdown.js';
import { createLogger } from '../common/logging/logger.js';
import type { ILogger } from '../common/logging/logger.types.js';

export interface StartServerOptions {
  readonly config?: AppConfig;
  readonly appOptions?: AppFactoryOptions;
  readonly shutdownOptions?: ShutdownOptions;
}

export interface RunningServer {
  readonly app: FastifyInstance;
  readonly config: Readonly<AppConfig>;
  readonly lifecycle: LifecycleManager;
  readonly shutdown: GracefulShutdownManager;
  readonly address: string;
  readonly port: number;
}

export async function startServer(options: StartServerOptions = {}): Promise<RunningServer> {
  const config = options.config ?? loadConfig();
  const rootLogger: ILogger = createLogger(config.logging, config.serviceName);

  rootLogger.info(
    { env: config.env, service: config.serviceName, version: config.version },
    'Bootstrapping WebOS Backend Foundation...'
  );

  const lifecycle = new LifecycleManager(rootLogger);

  // Phase: beforeStart
  await lifecycle.runPhase('beforeStart');

  // Create Fastify application instance
  const app = await createApp({
    config,
    ...options.appOptions
  });

  // Create shutdown manager
  const shutdownManager = new GracefulShutdownManager(
    app,
    lifecycle,
    rootLogger,
    options.shutdownOptions
  );

  // Bind OS termination signal handlers
  shutdownManager.attachSignalHandlers();

  // Listen on configured host and port
  try {
    const address = await app.listen({
      host: config.server.host,
      port: config.server.port
    });

    const port = (app.server.address() as { port: number })?.port ?? config.server.port;

    rootLogger.info(
      { host: config.server.host, port, address, env: config.env },
      `WebOS Backend is listening at ${address}`
    );

    // Phase: afterStart
    await lifecycle.runPhase('afterStart');

    return {
      app,
      config,
      lifecycle,
      shutdown: shutdownManager,
      address,
      port
    };
  } catch (err) {
    rootLogger.error({ err, host: config.server.host, port: config.server.port }, 'Failed to bind server to port!');
    await shutdownManager.shutdown('startup_failure');
    throw err;
  }
}
