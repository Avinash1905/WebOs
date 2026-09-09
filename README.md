# WebOS — OS Core & System Engine (Member 2)

The central operating system runtime, service orchestration engine, messaging bus, persistence layer, virtual file system, user authentication, security/permissions, trash recovery, and process runtime for **WebOS**.

---

## 🏛 Combined OS Core Architecture

```text
+---------------------------------------------------------------------------------------------------------+
|                                              WebOS Kernel                                               |
|  - Lifecycle State Machine (CREATED -> INITIALIZING -> RUNNING -> PAUSED -> STOPPING -> STOPPED/FAILED) |
|  - Topological DAG Dependency Resolution & Cycle Detection (Kahn's Algorithm)                           |
|  - Deterministic Shutdown & Rollback Coordinator                                                        |
+------------------------------------+------------------------------------+-------------------------------+
                                     |                                    |
                                     v                                    v
+------------------------------------+---------------+   +----------------+-------------------------------+
|                  ServiceRegistry                   |   |                System Event Bus                |
|  - Dynamic Service Registration & Lookup           |   |  - Typed pub/sub across all OS subsystems      |
|  - Dependency Validation & Graceful Rollback       |   |  - Wildcard listeners & Priority Queues        |
|  - Status Monitoring & Diagnostics                 |   |  - FIFO Event History Buffer with Query Engine |
+------------------------------------+---------------+   +----------------+-------------------------------+
                                     |                                    |
                                     +-----------------+------------------+
                                                       |
                                                       v
+------------------------------------------------------+--------------------------------------------------+
|                                                StorageEngine                                            |
|   - Storage Adapters: IndexedDBAdapter (Browser) & MemoryAdapter (Testing)                              |
|   - LRU Cache Layer (500 items capacity, key/namespace invalidation)                                   |
|   - Custom Type Serializer (Date, RegExp, Uint8Array, ArrayBuffer, Map, Set, Circular Protection)       |
|   - Scoped Namespaces ('vfs_meta', 'vfs_content', 'users', 'sessions', 'permissions', 'trash_meta')    |
|   - Atomic Multi-Operation Transactions, Batch Operations, Quota Monitoring                             |
+-------------------+----------------------------------+----------------------------------+---------------+
                    |                                  |                                  |
                    v                                  v                                  v
+-------------------+--------------+   +---------------+------------------+   +-----------+---------------+
|     Local Users & Sessions       |   |   Permission & Security Engine   |   |      Process Manager          |
|  - Multi-user provisioning       |   |  - POSIX bitmasks (0o755, 0o600) |   |  - Monotonic PID Allocator    |
|  - RBAC (ROOT, ADMIN, USER,      |   |  - Role-based capabilities       |   |  - Lifecycle State Machine    |
|    GUEST)                        |   |  - Protected paths (/system, /)  |   |  - Parent/Child Tree Hierarchy|
|  - Session management & switching|   |  - Custom per-user ACLs          |   |  - Cascading Termination      |
|  - Home directory provisioning   |   |  - Security Context Resolution   |   |  - Isolated Environment & CWD |
+-------------------+--------------+   +---------------+------------------+   +-----------+---------------+
                    |                                  |                                  |
                    +-----------------+----------------+                                  |
                                      |                                                   |
                                      v                                                   v
+-------------------------------------+---------------------------------------------------+---------------+
|                                            Virtual File System (VFS)                                    |
|   - In-Memory Directory Tree Index (path, id, parentId lookup) with strict '/' sandboxing               |
|   - File & Directory CRUD, Rename, Move, Recursive Copy, Delete, Append                                 |
|   - Integrated POSIX & ACL Permission Assertions via SecurityContext                                    |
|   - Granular Watchers with Recursive Bubbling & EventBus Dispatching                                    |
|   - Fast Substring, Extension, Path Scope Search Engine                                                 |
|   - Trash & Recovery Engine Integration (Safe Deletion, Metadata Tracking, Restore, Purge)              |
+---------------------------------------------------------------------------------------------------------+
```

---

## 📦 Core Subsystems

### 1. Kernel / Core Engine (`core/kernel/`)
- Coordinates system startup and runtime lifecycle.
- Validates and sorts service dependencies using Kahn's topological sort.
- Gracefully halts and rolls back started services in reverse order if startup encounters a failure.
- Complete lifecycle state machine (`CREATED`, `INITIALIZING`, `INITIALIZED`, `STARTING`, `RUNNING`, `PAUSING`, `PAUSED`, `STOPPING`, `STOPPED`, `FAILED`) and typed error hierarchy.

### 2. System Event Bus (`core/events/`)
- Strongly-typed master event map (`SystemEventMap`) covering:
  - System Lifecycle (`SYSTEM_BOOTING`, `SYSTEM_READY`, `SYSTEM_SHUTDOWN`, etc.)
  - FileSystem (`FILE_CREATED`, `FILE_UPDATED`, `FILE_DELETED`, `DIR_CREATED`, `DIR_DELETED`, etc.)
  - Users & Sessions (`USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `USER_LOGIN`, `SESSION_STARTED`, `SESSION_ENDED`)
  - Permissions (`PERMISSION_GRANTED`, `PERMISSION_REVOKED`, `SECURITY_VIOLATION`)
  - Processes (`PROCESS_CREATED`, `PROCESS_STARTED`, `PROCESS_PAUSED`, `PROCESS_TERMINATED`, etc.)
  - Storage & Trash (`STORAGE_SAVED`, `TRASH_ITEM_ADDED`, `TRASH_ITEM_RESTORED`, `TRASH_EMPTIED`, etc.)
- Priority listener queues, async emission (`emitAsync`), wildcard listeners (`subscribeAll`).
- Bounded FIFO history buffer with multi-field filtering and error isolation.

### 3. Storage Engine (`core/storage/`)
- **Storage Adapters**: Production `IndexedDBAdapter` and in-memory `MemoryAdapter`.
- **LRU Cache Layer (`CacheManager`)**: High-performance in-memory cache (default 500 items) with key and namespace invalidation.
- **Serialization & Deserialization (`Serializer`, `Deserializer`)**: Reconstructs `Date`, `RegExp`, `Uint8Array`, `ArrayBuffer`, `Map`, `Set`, with circular dependency protection.
- **Logical Namespaces (`NamespaceStorage`)**: Scoped storage partitions (e.g. `storage.namespace('vfs_meta')`) sharing the underlying store with stripped prefix querying.
- **Atomic Transactions (`StorageTransaction`)**: Staged operations with atomic commit/rollback.
- **Batch Operations**: High-throughput `getMany`, `setMany`, `deleteMany`.
- **Quota & Diagnostics**: Browser quota estimation, threshold warnings (`STORAGE_QUOTA_WARNING`), active health checks, and metrics.

### 4. Virtual File System (`core/filesystem/`)
- **Hierarchical Tree Model (`DirectoryTree`)**: Fast in-memory tree indexed by path, node ID, and parent ID for $O(1)$ lookups and fast directory traversals.
- **Path Resolution & Sandboxing (`PathResolver`)**: Robust normalization, sandboxing preventing root escapes, MIME type resolution, directory and extension extraction.
- **Dual Partition Persistence**: Node metadata stored in `vfs_meta`, content payloads stored in `vfs_content` on top of `StorageEngine`.
- **Full File/Directory Operations**: `createFile`, `readFile`, `writeFile`, `appendFile`, `createDirectory`, `listDirectory`, `stat`, `exists`, `rename`, `move`, `copy`, `delete`.
- **Cycle Prevention**: Circular move/copy detection (`DirectoryCycleError`) preventing a directory from moving or copying into its own descendants.
- **Reactive Watchers & Event Bus**: Granular file/directory watcher callbacks with recursive bubbling, plus automatic dispatching of file events across the OS EventBus.
- **Search Engine (`FileSearch`)**: High-performance search with name substring query, extension filter, node type filter, and subpath scoping.

### 5. Permission & Security Engine (`core/permissions/`)
- **POSIX Octal Bitmasks**: Standard POSIX permission evaluation (Owner / Group / Others for Read, Write, Execute). Constants: `0o644` (Default File), `0o755` (Default Dir/Exec), `0o600` (Private File), `0o700` (Private Dir).
- **Role-Based Access Control (RBAC)**: Supports `ROOT`, `ADMIN`, `USER`, `GUEST`. Admins and Root bypass standard restrictions; Guest accounts are restricted to `/tmp` and guest-owned resources.
- **Protected System Paths**: Structural protection preventing non-admin writes to `/system`, `/bin`, `/etc`, `/applications`, and `/`.
- **Custom Access Control Lists (ACLs)**: Explicit per-user permissions (`grantPermission`, `revokePermission`) overriding or supplementing POSIX flags.
- **Security Context**: Every operation resolves caller `userId`, `role`, and `isSystem`.

### 6. Local User & Session System (`core/users/`)
- **User Management**: User creation, updating, deletion, and lookup with protected accounts (`admin`, `root`, `guest`).
- **Home Directory Provisioning**: Automatically provisions `/home/{username}` with standard `Desktop`, `Documents`, `Downloads`, `Pictures`, and `Music` subdirectories.
- **Session Management**: Session lifecycle (`createSession`, `switchUser`, `touchSession`, `endSession`), expiration handling, and active user tracking.
- **Persistence**: User accounts and active sessions persisted to `users` and `sessions` storage namespaces.

### 7. Trash & Recovery Subsystem (`core/trash/`)
- **Safe File Deletion**: Intercepts `delete` operations to move items into `/trash` with unique trash IDs and full metadata records.
- **Restoration**: Restores trashed files and directories to their original path or a custom destination path with auto-created parent directory structures.
- **Purge & Empty**: Permanent removal of individual trashed files or complete purge (`emptyTrash`).
- **Storage Isolation**: Metadata stored in `trash_meta` namespace and content payloads in `trash_content`.

### 8. Process Manager Subsystem (`core/process/`)
- **PID Allocator (`PidManager`)**: Monotonic, unique PID allocation with recycling and collision avoidance.
- **Process State Machine (`ProcessStateTracker`)**: Validated transitions: `CREATED` -> `RUNNING` <-> `PAUSED` -> `TERMINATED`.
- **Process Tree Hierarchy**: Parent-child relationship tracking, child queries, process tree construction (`getProcessTree`), and recursive cascading termination.
- **Environment & CWD Isolation**: Per-process environment variables (`USER`, `HOME`, `PATH`, etc.) and working directory resolution.
- **Process Security**: Ownership checks preventing non-admin users from pausing, resuming, or terminating processes belonging to other users.

### 9. Process Scheduler Subsystem (`core/scheduler/`)
- **Priority-Based Scheduling**: Multi-level priority queues (`CRITICAL`, `HIGH`, `NORMAL`, `LOW`, `IDLE`) with priority weights and configurable time slice multipliers.
- **Fair Round-Robin Ordering (`PriorityRoundRobinPolicy`)**: Round-robin fair dispatching per bucket and priority cycle.
- **Preemptive Stepping**: Cooperative/time-sliced step execution (`scheduler.step()`), timer loops (`startAutoLoop`), and preemption handling.
- **Anti-Starvation Aging**: Automatic priority elevation for starved ready processes waiting beyond `agingThresholdMs`.
- **Telemetry & Metrics (`SchedulerMetricsTracker`)**: Real-time tracking of context switches, CPU runtimes, process states, and uptime.

### 10. Shell / Terminal Engine (`core/shell/`)
- **Tokenizer & Parser (`CommandParser`)**: Robust command line parsing supporting single/double quotes, escape sequences, short flags (`-la`), and key-value options (`--key=value`).
- **Session Environment & History (`ShellSession`, `Environment`, `ShellHistory`)**: Isolated user shell sessions with working directories (`cwd`), environment variable expansion (`$VAR`, `${VAR}`), and bounded history.
- **Built-in System Commands (`BuiltinCommands`)**:
  - Filesystem: `pwd`, `ls`, `cd`, `mkdir`, `touch`, `cat`, `write`, `append`, `cp`, `mv`, `rm`
  - Users & Sessions: `whoami`, `users`, `session`
  - Processes: `ps`, `kill`
  - System: `help`, `clear`, `echo`, `date`, `uptime`
- **Extensible Command Registry (`CommandRegistry`)**: Dynamic registration of custom shell commands and aliases.

---

## 🚀 Complete Integration Example

```ts
import { Kernel } from './core/kernel/index.js';
import { EventBus } from './core/events/index.js';
import { StorageEngine } from './core/storage/index.js';
import { UserManager, USER_ROLES } from './core/users/index.js';
import { PermissionManager, DEFAULT_MODES } from './core/permissions/index.js';
import { FileSystem } from './core/filesystem/index.js';
import { TrashManager } from './core/trash/index.js';
import { ProcessManager } from './core/process/index.js';
import { Scheduler } from './core/scheduler/index.js';
import { Shell } from './core/shell/index.js';

// 1. Instantiate Core Subsystems
const kernel = new Kernel();
const eventBus = new EventBus();
const storage = new StorageEngine({ adapter: 'memory', eventBus });

const userManager = new UserManager({ storage, eventBus });
const permManager = new PermissionManager({ storage, eventBus, userManager });
const fs = new FileSystem({ storage, eventBus, permissionManager: permManager, userManager });
const trashManager = new TrashManager({ storage, eventBus, fileSystem: fs, permissionManager: permManager });
const processManager = new ProcessManager({ storage, eventBus, userManager, permissionManager: permManager, fileSystem: fs });
const scheduler = new Scheduler({ storage, eventBus, processManager });
const shell = new Shell({
  storage,
  eventBus,
  fileSystem: fs,
  permissionManager: permManager,
  userManager,
  processManager,
  scheduler,
  trashManager,
});

// Connect cross-service references
userManager.attachFileSystem(fs);
fs.attachTrashManager(trashManager);

// 2. Register all 10 services with Kernel
kernel.registerService(eventBus);
kernel.registerService(storage);
kernel.registerService(userManager);
kernel.registerService(permManager);
kernel.registerService(fs);
kernel.registerService(trashManager);
kernel.registerService(processManager);
kernel.registerService(scheduler);
kernel.registerService(shell);

eventBus.attachToKernel(kernel);

// 3. Boot WebOS
await kernel.initialize();
await kernel.start();

console.log(`WebOS Kernel status: ${kernel.getStatus()}`); // RUNNING

// 4. Create User & Launch Shell Session
const charlie = await userManager.createUser({ username: 'charlie', role: USER_ROLES.USER, provisionHomeDirectory: true });
const session = shell.createSession({ userId: charlie.id });

// 5. Execute Shell Commands
await session.execute('mkdir -p workspace/src');
await session.execute('write workspace/src/app.ts \'console.log("Hello WebOS");\'');
const catRes = await session.execute('cat workspace/src/app.ts');
console.log(catRes.output); // console.log("Hello WebOS");

// 6. Launch & Schedule Process
const proc = await processManager.createProcess({ name: 'AppTask', userId: charlie.id, autoStart: true });
scheduler.startProcessScheduling(proc.pid);
scheduler.step();
```

---

## 🧪 Testing & Verification

All subsystems are covered by unit and integration test suites:

```bash
# Run Vitest test suite (156 tests across 15 test files)
npm test

# Run strict TypeScript typechecking
npm run typecheck

# Build distribution output
npm run build
```

### Test Breakdown
- `tests/KernelLifecycle.test.ts` (14 tests)
- `tests/ServiceDependency.test.ts` (9 tests)
- `tests/ServiceRegistry.test.ts` (8 tests)
- `tests/events/EventBus.test.ts` (27 tests)
- `tests/storage/StorageEngine.test.ts` (19 tests)
- `tests/filesystem/FileSystem.test.ts` (24 tests)
- `tests/users/UserManager.test.ts` (9 tests)
- `tests/permissions/PermissionManager.test.ts` (7 tests)
- `tests/trash/TrashManager.test.ts` (5 tests)
- `tests/process/ProcessManager.test.ts` (8 tests)
- `tests/scheduler/Scheduler.test.ts` (8 tests)
- `tests/shell/CommandParser.test.ts` (8 tests)
- `tests/shell/Shell.test.ts` (5 tests)
- `tests/integration/OSCoreIntegration.test.ts` (4 tests)
- `tests/integration/OSCoreCombinedEngine.test.ts` (1 test)

**Total: 15 test suites, 156 tests passing (100% pass rate).**
