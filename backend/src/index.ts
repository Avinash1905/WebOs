/**
 * WebOS Backend Foundation - Main Process Entry Point
 */

import { startServer } from './server/server.js';
import { loadConfig } from './server/config.js';
import { createLogger } from './common/logging/logger.js';

async function bootstrap(): Promise<void> {
  try {
    const config = loadConfig();
    await startServer({ config });
  } catch (err) {
    const fallbackLogger = createLogger({
      level: 'error',
      prettyPrint: true,
      redactPaths: []
    });
    fallbackLogger.fatal({ err }, 'Fatal error during WebOS backend startup!');
    process.exit(1);
  }
}

// Automatically start server when executed directly
if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}

// Barrel re-exports for library usage & testing
export * from './server/app.js';
export * from './server/server.js';
export * from './server/config.js';
export * from './server/routes.js';
export * from './server/lifecycle.js';
export * from './server/shutdown.js';
export * from './health/index.js';
export * from './common/errors/index.js';
export * from './common/logging/index.js';
export * from './common/middleware/index.js';
export * from './common/validation/index.js';
export * from './common/types/common.js';
export * from './common/types/http.types.js';
export * from './common/types/context.types.js';
export * from './common/utils/id.js';
export * from './common/utils/time.js';
export * from './common/utils/object.js';
export * from './common/utils/string.js';
export * from './services/index.js';
export * from './repositories/index.js';
