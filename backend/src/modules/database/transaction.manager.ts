/**
 * WebOS Backend - Transaction Manager
 * Executes ACID transactions with exponential backoff retries for deadlock & serialization failures.
 */

import type { IPrismaClient } from './prisma.types.js';
import type { ILogger } from '../../common/logging/logger.types.js';

export interface RetryOptions {
  readonly maxRetries?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
}

export class TransactionManager {
  private readonly client: IPrismaClient;
  private readonly logger: ILogger;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(client: IPrismaClient, logger: ILogger, options: RetryOptions = {}) {
    this.client = client;
    this.logger = logger.child({ component: 'TransactionManager' });
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 100;
    this.maxDelayMs = options.maxDelayMs ?? 2000;
  }

  /**
   * Runs an operation inside a database transaction, automatically retrying if a deadlock occurs.
   */
  public async runWithRetry<T>(
    operation: (tx: IPrismaClient) => Promise<T>,
    operationName = 'Transaction'
  ): Promise<T> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        return await this.client.$transaction(async (tx) => {
          return operation(tx);
        });
      } catch (err: unknown) {
        attempt++;
        const isRetryable = this.isRetryableError(err);

        if (isRetryable && attempt <= this.maxRetries) {
          const delay = Math.min(
            this.maxDelayMs,
            this.baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 50
          );

          this.logger.warn(
            { attempt, maxRetries: this.maxRetries, delay, err },
            `Retryable transaction conflict encountered in '${operationName}'. Retrying in ${Math.round(delay)}ms...`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        this.logger.error(
          { attempt, maxRetries: this.maxRetries, err },
          `Transaction '${operationName}' failed permanently.`
        );
        throw err;
      }
    }

    throw new Error(`Transaction '${operationName}' failed after ${this.maxRetries} retries`);
  }

  private isRetryableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const err = error as Record<string, unknown>;
    const code = (err.code as string) || '';
    const message = (err.message as string) || '';

    // PostgreSQL & Prisma deadlock and serialization codes:
    // P2034: Transaction failed due to a write conflict or a deadlock. Please retry.
    // 40P01: Deadlock detected
    // 40001: Serialization failure
    if (code === 'P2034' || code === '40P01' || code === '40001') {
      return true;
    }

    if (
      message.includes('deadlock') ||
      message.includes('serialization failure') ||
      message.includes('write conflict')
    ) {
      return true;
    }

    return false;
  }
}
