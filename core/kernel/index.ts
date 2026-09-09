/**
 * @file index.ts
 * @description WebOS Module 1 — Kernel / Core Engine barrel exports.
 */

// Core Kernel Engine
export { Kernel } from './Kernel.js';

// Configuration
export {
  DEFAULT_KERNEL_CONFIG,
  type KernelConfig,
  type KernelLogger,
  resolveKernelConfig,
} from './KernelConfig.js';

// State Tracker
export { KernelState } from './KernelState.js';

// Service Registry & Interfaces
export { BaseSystemService, type SystemService } from './Service.js';
export { ServiceRegistry } from './ServiceRegistry.js';

// Dependency Resolution
export { ServiceDependencyResolver } from './ServiceDependency.js';

// Error Hierarchy
export {
  CircularDependencyError,
  InvalidKernelStateError,
  KernelError,
  KernelTimeoutError,
  MissingDependencyError,
  ServiceAlreadyRegisteredError,
  ServiceInitializationError,
  ServiceNotFoundError,
  ServiceShutdownError,
  ServiceStartupError,
} from './KernelError.js';

// Types & Contracts
export type {
  KernelEvent,
  KernelEventListener,
  KernelEventType,
  KernelStateSnapshot,
  KernelStatus,
  ServiceInfo,
  ServiceStatus,
} from './types.js';
