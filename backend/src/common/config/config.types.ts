/**
 * WebOS Backend Foundation - Configuration Types
 */

export type Environment = 'development' | 'production' | 'test';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface ServerConfig {
  readonly host: string;
  readonly port: number;
  readonly shutdownTimeoutMs: number;
  readonly maxPayloadSizeBytes: number;
}

export interface CorsConfig {
  readonly origins: readonly string[];
  readonly credentials: boolean;
  readonly maxAge: number;
}

export interface LogConfig {
  readonly level: LogLevel;
  readonly prettyPrint: boolean;
  readonly redactPaths: readonly string[];
}

export interface AppConfig {
  readonly env: Environment;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly isTest: boolean;
  readonly serviceName: string;
  readonly version: string;
  readonly server: ServerConfig;
  readonly cors: CorsConfig;
  readonly logging: LogConfig;
}

export interface RawEnv {
  NODE_ENV?: string;
  HOST?: string;
  PORT?: string;
  LOG_LEVEL?: string;
  CORS_ORIGIN?: string;
  [key: string]: string | undefined;
}
