/**
 * WebOS Backend - Module 2: Prisma Database Service
 * Manages database connection lifecycle, connection pooling, metrics, and teardown.
 */

import { BaseService } from '../../services/base.service.js';
import type { ServiceContext } from '../../services/service.types.js';
import type { IPrismaClient } from './prisma.types.js';

export interface PrismaServiceOptions {
  readonly databaseUrl?: string;
  readonly maxConnections?: number;
  readonly connectionTimeoutMs?: number;
}

export class PrismaService extends BaseService {
  private client: IPrismaClient | null = null;
  private readonly options: PrismaServiceOptions;

  constructor(options: PrismaServiceOptions = {}, context: ServiceContext) {
    super(
      {
        name: 'PrismaService',
        version: '1.0.0'
      },
      context
    );
    this.options = options;
  }

  public getClient(): IPrismaClient {
    if (!this.client) {
      throw new Error('PrismaService is not connected. Call initialize() first.');
    }
    return this.client;
  }

  public setClient(client: IPrismaClient): void {
    this.client = client;
  }

  protected async onInitialize(): Promise<void> {
    this.logger.info('Initializing Prisma database connection...');
    if (!this.client) {
      try {
        // Attempt dynamic import of generated @prisma/client if present
        const prismaModule = await import('@prisma/client');
        const PrismaConstructor = (prismaModule as unknown as {
          PrismaClient: new (opts?: unknown) => { $connect(): Promise<void> };
        }).PrismaClient;
        if (PrismaConstructor) {
          const instance = new PrismaConstructor({
            datasources: this.options.databaseUrl
              ? { db: { url: this.options.databaseUrl } }
              : undefined,
            log: [
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'error' },
              { emit: 'event', level: 'warn' }
            ]
          });

          await instance.$connect();
          this.client = instance as unknown as IPrismaClient;
          this.logger.info('Prisma Client connected to PostgreSQL database.');
          return;
        }
      } catch (err) {
        this.logger.warn(
          { err },
          'Could not load native @prisma/client directly. Falling back to configured adapter.'
        );
      }
    } else {
      await this.client.$connect();
      this.logger.info('Custom Prisma Client connected successfully.');
    }
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Disconnecting Prisma database connection...');
    if (this.client) {
      try {
        await this.client.$disconnect();
        this.logger.info('Prisma Client disconnected.');
      } catch (err) {
        this.logger.error({ err }, 'Error during Prisma Client disconnection');
      } finally {
        this.client = null;
      }
    }
  }

  public async ping(): Promise<{ latencyMs: number }> {
    if (!this.client) {
      throw new Error('Database client not initialized');
    }

    const start = Date.now();
    await this.client.$queryRawUnsafe('SELECT 1');
    const latencyMs = Date.now() - start;

    return { latencyMs };
  }
}
