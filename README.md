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
|   - Logical Namespaces ('vfs_meta', 'vfs_content', 'settings', etc.)              |
|   - Atomic Transactions, Batch Operations & Quota Monitoring                      |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                             Virtual File System (VFS)                             |
|   - Hierarchical Unix-style Directory Tree & Path Normalization                   |
|   - Strict Root Sandboxing (`/` is root, no traversal escapes)                    |
|   - Fast In-Memory Tree Index (Lookup by Path, ID, Parent ID)                     |
|   - Storage Partitioning (Metadata in `vfs_meta`, Content in `vfs_content`)       |
|   - File & Directory CRUD, Rename, Move, Recursive Copy, Delete                   |
|   - File Watcher Subscriptions & Reactive System Event Bus Dispatch               |
|   - Search Engine (Name queries, extension, type, path prefix filtering)          |
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
- **Logical Namespaces (`NamespaceStorage`)**: Scoped storage partitions (e.g. `storage.namespace('vfs_meta')`) sharing the underlying store with stripped prefix querying.
- **Atomic Transactions (`StorageTransaction`)**: Staged operations with atomic commit/rollback.
- **Batch Operations**: High-throughput `getMany`, `setMany`, `deleteMany`.
- **Quota & Diagnostics**: Browser quota estimation, threshold warnings (`STORAGE_QUOTA_WARNING`), active health checks, and metrics.

### Module 4: Virtual File System (`core/filesystem/`)
- **Hierarchical Tree Model (`DirectoryTree`)**: Fast in-memory tree indexed by path, node ID, and parent ID for $O(1)$ lookups and fast directory traversals.
- **Path Resolution & Sandboxing (`PathResolver`)**: Robust normalization, sandboxing preventing root escapes, MIME type resolution, directory and extension extraction.
- **Dual Partition Persistence**: Node metadata stored in `vfs_meta`, content payloads stored in `vfs_content` on top of `StorageEngine` for instant hydration.
- **Full File/Directory Operations**: `createFile`, `readFile`, `writeFile`, `appendFile`, `createDirectory`, `listDirectory`, `stat`, `exists`, `rename`, `move`, `copy`, `delete`.
- **Cycle Prevention**: Circular move/copy detection (`DirectoryCycleError`) preventing a directory from moving or copying into its own descendants.
- **Reactive Watchers & Event Bus**: Granular file/directory watcher callbacks with recursive bubbling, plus automatic dispatching of `FILE_CREATED`, `FILE_UPDATED`, `FILE_DELETED`, `DIR_CREATED`, `DIR_DELETED` across the OS EventBus.
- **Search Engine (`FileSearch`)**: High-performance search with name substring query, extension filter, node type filter, and subpath scoping.

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
├── storage/
│   ├── StorageEngine.ts
│   ├── StorageAdapter.ts
│   ├── IndexedDBAdapter.ts
│   ├── MemoryAdapter.ts
│   ├── Serializer.ts
│   ├── Deserializer.ts
│   ├── CacheManager.ts
│   ├── QuotaManager.ts
│   ├── RecoveryManager.ts
│   ├── StorageTransaction.ts
│   ├── StorageError.ts
│   ├── StorageConfig.ts
│   ├── types.ts
│   └── index.ts
└── filesystem/
    ├── FileSystem.ts
    ├── DirectoryTree.ts
    ├── PathResolver.ts
    ├── FileMetadata.ts
    ├── File.ts
    ├── Directory.ts
    ├── FileSearch.ts
    ├── FileWatcher.ts
    ├── FileSystemConfig.ts
    ├── FileSystemError.ts
    ├── types.ts
    └── index.ts
```

---

## Code Examples

### 1. Bootstrapping Kernel with EventBus, StorageEngine, and FileSystem

```ts
import { Kernel } from './core/kernel/index.js';
import { EventBus } from './core/events/index.js';
import { StorageEngine } from './core/storage/index.js';
import { FileSystem } from './core/filesystem/index.js';

const kernel = new Kernel();
const eventBus = new EventBus();
const storage = new StorageEngine({ eventBus });
const fs = new FileSystem({ storage, eventBus });

// Register core OS services
kernel.registerService(eventBus);
kernel.registerService(storage);
kernel.registerService(fs);

// Bridge Kernel lifecycle events into EventBus
eventBus.attachToKernel(kernel);

// Initialize and start OS runtime in dependency order
await kernel.initialize();
await kernel.start();
```

### 2. File and Directory Operations in Virtual File System

```ts
// Create directories
await fs.createDirectory('/home/user/Projects/WebOS', { recursive: true });

// Write files (supports text, JSON, binary)
await fs.writeFile('/home/user/Projects/WebOS/config.json', { theme: 'dark', version: '1.0.0' });
await fs.createFile('/home/user/Projects/WebOS/main.ts', { content: 'console.log("Hello WebOS!");' });

// Read files
const config = await fs.readFile('/home/user/Projects/WebOS/config.json', { encoding: 'json' });
const source = await fs.readFile('/home/user/Projects/WebOS/main.ts', { encoding: 'utf-8' });

// List directory entries
const entries = await fs.listDirectory('/home/user/Projects/WebOS', {
  sortBy: 'name',
  sortOrder: 'asc',
});
```

### 3. File System Watchers & Search

```ts
// Subscribe to file/directory changes
const unwatch = fs.watch('/home/user/Projects', (event) => {
  console.log(`[VFS Watcher] ${event.type}: ${event.path}`);
}, { recursive: true });

// Search files across filesystem
const results = await fs.search({
  query: 'main',
  extension: 'ts',
  pathPrefix: '/home/user/Projects',
});
```

---

## Testing & Verification

```bash
# Run Vitest test suite (101 tests across 6 test files)
npm test

# Run strict TypeScript typechecking
npm run typecheck

# Build distribution output
npm run build
```
