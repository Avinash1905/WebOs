# WebOS — OS Core & System Engine (Member 2)

The central operating system runtime, service orchestration engine, messaging bus, and persistence engine for **WebOS**.

---

## Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                                 WebOS Kernel                                      |
|  - Lifecycle State Machine (CREATED -> INITIALIZING -> RUNNING -> ...)            |
|  - Rollback Coordinator & Timeout Enforcer                                        |
+--------------------+-------------------------------------+------------------------+
                     |                                     |
                     v                                     v
+------------------------------------+   +------------------------------------------+
|          ServiceRegistry           |   |            System Event Bus              |
|  - Service Registration & Lookup   |   |  - Typed pub/sub & wildcard listeners   |
|  - Topological DAG Resolution      |   |  - Priority dispatching (FIFO for equal) |
|  - Cycle & Missing Dep Detection   |   |  - Async event support (emitAsync)       |
|  - Graceful Shutdown & Rollback    |   |  - Bounded history & diagnostics stats   |
+--------------------+---------------+   +--------------------+---------------------+
                     |                                        |
                     +-------------------+--------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                  StorageEngine                                    |
|   - Modular Persistence Abstraction (IndexedDB / Memory)                          |
|   - Bounded LRU Cache & Invalidation by Key/Namespace                            |
|   - Type-Safe Serializer (Dates, RegExps, Buffers, Maps, Sets)                   |
|   - Logical Namespaces ('filesystem', 'settings', 'users', etc.)                  |
|   - Atomic Transactions, Batch Operations & Quota Monitoring                      |
+-----------------------------------------------------------------------------------+
```

---

## Modules

### Module 1: Kernel / Core Engine (`core/kernel/`)
- Coordinates system startup, validates and sorts service dependencies using Kahn's topological sort.
- Gracefully halts and rolls back started services in reverse order if startup fails.
- Complete lifecycle state machine and typed error hierarchy.

### Module 2: System Event Bus (`core/events/`)
- Strongly-typed master event map (`SystemEventMap`) covering System Lifecycle, FileSystem, Process, Application, User/Session, Storage, Security/Permissions.
- Priority listener queues, async emission (`emitAsync`), wildcard listeners (`subscribeAll`).
- Bounded FIFO history buffer with multi-field filtering and error isolation.

### Module 3: Storage Engine (`core/storage/`)
- **Storage Adapters**: Production `IndexedDBAdapter` and in-memory `MemoryAdapter`.
- **LRU Cache Layer (`CacheManager`)**: High-performance in-memory cache (default 500 items) with key and namespace invalidation.
- **Serialization & Deserialization (`Serializer`, `Deserializer`)**: Reconstructs `Date`, `RegExp`, `Uint8Array`, `ArrayBuffer`, `Map`, `Set`, with circular dependency protection.
- **Logical Namespaces (`NamespaceStorage`)**: Scoped storage partitions (e.g. `storage.namespace('filesystem')`) sharing the underlying store with stripped prefix querying.
- **Atomic Transactions (`StorageTransaction`)**: Staged operations with atomic commit/rollback.
- **Batch Operations**: High-throughput `getMany`, `setMany`, `deleteMany`.
- **Quota & Diagnostics**: Browser quota estimation, threshold warnings (`STORAGE_QUOTA_WARNING`), active health checks, and metrics.

---

## Directory Structure

```text
core/
├── kernel/
│   ├── Kernel.ts
│   ├── KernelConfig.ts
│   ├── KernelState.ts
│   ├── ServiceRegistry.ts
│   ├── Service.ts
│   ├── ServiceDependency.ts
│   ├── KernelError.ts
│   ├── types.ts
│   └── index.ts
├── events/
│   ├── EventBus.ts
│   ├── EventTypes.ts
│   ├── EventPayloads.ts
│   ├── EventSubscription.ts
│   ├── EventHistory.ts
│   ├── EventError.ts
│   ├── types.ts
│   └── index.ts
└── storage/
    ├── StorageEngine.ts
    ├── StorageAdapter.ts
    ├── IndexedDBAdapter.ts
    ├── MemoryAdapter.ts
    ├── Serializer.ts
    ├── Deserializer.ts
    ├── CacheManager.ts
    ├── QuotaManager.ts
    ├── RecoveryManager.ts
    ├── StorageTransaction.ts
    ├── StorageError.ts
    ├── StorageConfig.ts
    ├── types.ts
    └── index.ts
```

---

## Code Examples

### 1. Bootstrapping Kernel with EventBus and StorageEngine

```ts
import { Kernel } from './core/kernel/index.js';
import { EventBus } from './core/events/index.js';
import { StorageEngine } from './core/storage/index.js';

const kernel = new Kernel();
const eventBus = new EventBus();
const storage = new StorageEngine({ eventBus });

// Register core OS services
kernel.registerService(eventBus);
kernel.registerService(storage);

// Bridge Kernel lifecycle events into EventBus
eventBus.attachToKernel(kernel);

// Initialize and start OS runtime
await kernel.initialize();
await kernel.start();
```

### 2. Using Namespaces (Future Virtual File System Example)

```ts
import { StorageEngine } from './core/storage/index.js';

const storage = new StorageEngine();
await storage.initialize();

// Scoped namespace for Virtual File System
const vfsStorage = storage.namespace('filesystem');

// Persisting file metadata
interface FileMetadata {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
}

await vfsStorage.set('file:123', {
  id: '123',
  name: 'document.pdf',
  size: 1048576,
  createdAt: new Date(),
});

// Retrieving and type reconstruction
const file = await vfsStorage.get<FileMetadata>('file:123');
console.log(file?.name, file?.createdAt instanceof Date); // true
```

### 3. Atomic Storage Transactions

```ts
await storage.transaction(async (tx) => {
  tx.set('account:alice', { balance: 50 });
  tx.set('account:bob', { balance: 150 });
  tx.delete('pending_transfer:tx_99');
});
```

### 4. Storage Health Check & Statistics

```ts
const health = await storage.healthCheck();
console.log(`Healthy: ${health.healthy}, Latency: ${health.latencyMs}ms`);

const stats = await storage.getStats();
console.log(`Reads: ${stats.reads}, Writes: ${stats.writes}, Cache Hits: ${stats.cacheHits}`);
```

---

## Testing & Verification

```bash
# Run Vitest test suite (77 tests across 5 test files)
npm test

# Run strict TypeScript typechecking
npm run typecheck

# Build distribution output
npm run build
```
