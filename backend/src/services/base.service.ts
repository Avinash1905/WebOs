/**
 * WebOS Backend Foundation - Base Service
 * Abstract base class for domain services with lifecycle management and structured logging.
 */

import type { IService, ServiceContext, ServiceMetadata, ServiceState } from './service.types.js';
import type { ILogger } from '../common/logging/logger.types.js';
import { InternalServerError } from '../common/errors/specific-errors.js';

export abstract class BaseService implements IService {
  public readonly metadata: ServiceMetadata;
  protected readonly logger: ILogger;
  private state: ServiceState = 'uninitialized';

  constructor(metadata: ServiceMetadata, context: ServiceContext) {
    this.metadata = metadata;
    this.logger = context.logger.child({ service: metadata.name });
  }

  public getState(): ServiceState {
    return this.state;
  }

  public async initialize(): Promise<void> {
    if (this.state === 'ready') {
      return;
    }

    this.state = 'initializing';
    this.logger.debug({ service: this.metadata.name }, `Initializing service '${this.metadata.name}'...`);

    try {
      await this.onInitialize();
      this.state = 'ready';
      this.logger.debug({ service: this.metadata.name }, `Service '${this.metadata.name}' ready.`);
    } catch (err) {
      this.state = 'failed';
      this.logger.error(
        { service: this.metadata.name, err },
        `Failed to initialize service '${this.metadata.name}'`
      );
      throw new InternalServerError(`Service '${this.metadata.name}' initialization failed`, err as Error);
    }
  }

  public async shutdown(): Promise<void> {
    if (this.state === 'stopped' || this.state === 'uninitialized') {
      return;
    }

    this.state = 'stopping';
    this.logger.debug({ service: this.metadata.name }, `Shutting down service '${this.metadata.name}'...`);

    try {
      await this.onShutdown();
      this.state = 'stopped';
      this.logger.debug({ service: this.metadata.name }, `Service '${this.metadata.name}' stopped.`);
    } catch (err) {
      this.state = 'failed';
      this.logger.error(
        { service: this.metadata.name, err },
        `Error during service '${this.metadata.name}' shutdown`
      );
      throw err;
    }
  }

  /**
   * Subclasses override this method to perform initialization logic
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Subclasses override this method to perform cleanup logic
   */
  protected abstract onShutdown(): Promise<void>;
}
