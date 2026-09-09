/**
 * @file index.ts
 * @description WebOS Module 3 — Storage Engine barrel exports.
 */

// Storage Engine Runtime & Namespaces
export { NamespaceStorage, StorageEngine } from './StorageEngine.js';

// Storage Adapters
export { IndexedDBAdapter } from './IndexedDBAdapter.js';
export { MemoryAdapter } from './MemoryAdapter.js';
export type { StorageAdapter } from './StorageAdapter.js';

// Cache, Serialization & Managers
export { CacheManager } from './CacheManager.js';
export { Deserializer } from './Deserializer.js';
export { QuotaManager } from './QuotaManager.js';
export { RecoveryManager } from './RecoveryManager.js';
export { Serializer } from './Serializer.js';
export { StorageTransaction } from './StorageTransaction.js';

// Configuration
export {
  DEFAULT_STORAGE_CONFIG,
  type ResolvedStorageConfig,
  type StorageConfig,
  resolveStorageConfig,
} from './StorageConfig.js';

// Error Hierarchy
export {
  StorageConnectionError,
  StorageDeleteError,
  StorageError,
  StorageInitializationError,
  StorageQuotaError,
  StorageReadError,
  StorageRecoveryError,
  StorageSerializationError,
  StorageTransactionError,
  StorageWriteError,
} from './StorageError.js';

// Types & Contracts
export type {
  BatchOperation,
  QuotaInfo,
  StorageEntry,
  StorageHealthReport,
  StorageStats,
  StorageValue,
} from './types.js';
