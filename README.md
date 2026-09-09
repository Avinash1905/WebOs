# WebOS — OS Core & System Engine (Member 2)

The central operating system runtime, service orchestration engine, and messaging bus for **WebOS**.

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
+------------------------------------+   +------------------------------------------+
                     |                                     |
                     +------------------+------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                            Core System Services                                   |
|   FileSystem | Storage | ProcessManager | Applications | Permissions | Users      |
+-----------------------------------------------------------------------------------+
```

---

## Modules

### Module 1: Kernel / Core Engine (`core/kernel/`)

Coordinates system startup, validates and sorts service dependencies, and manages lifecycle transitions.

- **Service Lifecycle State Machine**: Full lifecycle tracking (`REGISTERED`, `INITIALIZING`, `INITIALIZED`, `STARTING`, `RUNNING`, `STOPPING`, `STOPPED`, `FAILED`).
- **Topological Dependency Resolution**: Directed Acyclic Graph (DAG) ordering with Kahn's algorithm ensuring dependencies start before dependents.
- **Reverse Shutdown Ordering**: Guarantees dependents stop before prerequisites.
- **Cycle Detection**: Automatic cycle detection and exact path reporting (`A -> B -> C -> A`).
- **Rollback on Startup Failure**: Automatically halts and tears down previously started services in reverse order if any downstream service fails during startup.
- **Typed Error Hierarchy**: Granular error types (`MissingDependencyError`, `CircularDependencyError`, `ServiceStartupError`, `KernelTimeoutError`, etc.).
- **System Event Hooks**: Lifecycle event hooks (`SYSTEM_INITIALIZING`, `SYSTEM_INITIALIZED`, `SYSTEM_STARTING`, `SYSTEM_STARTED`, `SYSTEM_STOPPING`, `SYSTEM_STOPPED`, `SYSTEM_ERROR`).

### Module 2: System Event Bus (`core/events/`)

Decoupled, strongly-typed messaging backbone connecting all OS components.

- **Master Event Map (`SystemEventMap`)**: Strict TypeScript contracts for payloads across all categories:
  - **System Lifecycle**: `SYSTEM_INITIALIZING`, `SYSTEM_INITIALIZED`, `SYSTEM_STARTING`, `SYSTEM_STARTED`, `SYSTEM_STOPPING`, `SYSTEM_STOPPED`, `SYSTEM_ERROR`
  - **File System**: `FILE_CREATED`, `FILE_UPDATED`, `FILE_DELETED`, `FILE_RENAMED`, `FILE_MOVED`, `FILE_COPIED`, `DIRECTORY_CREATED`, `DIRECTORY_DELETED`, `DIRECTORY_RENAMED`, `DIRECTORY_MOVED`
  - **Process**: `PROCESS_CREATED`, `PROCESS_STARTED`, `PROCESS_PAUSED`, `PROCESS_RESUMED`, `PROCESS_STOPPED`, `PROCESS_TERMINATED`, `PROCESS_RESTARTED`, `PROCESS_ERROR`
  - **Application**: `APP_REGISTERED`, `APP_OPENED`, `APP_CLOSED`, `APP_ERROR`
  - **User & Session**: `USER_LOGIN`, `USER_LOGOUT`, `SESSION_STARTED`, `SESSION_ENDED`
  - **Storage**: `STORAGE_READY`, `STORAGE_CHANGED`, `STORAGE_QUOTA_WARNING`, `STORAGE_ERROR`
  - **Security & Permissions**: `PERMISSION_GRANTED`, `PERMISSION_DENIED`, `PERMISSION_REVOKED`, `SECURITY_VIOLATION`
- **Standardized Envelope (`SystemEvent<T>`)**: Unique event ID (`evt_<timestamp>_<counter>_<rand>`), timestamp, source module, payload, and optional `correlationId`, `userId`, `processId`, `applicationId`.
- **Subscription Management**: `subscribe()`, `once()`, `unsubscribe()`, `subscribeAll()` (wildcard listeners).
- **Execution Priority**: Configurable priority ordering (higher priority runs first; FIFO for equal priority).
- **Async Delivery**: `emitAsync()` awaits asynchronous subscribers with isolated error handling.
- **Error Isolation**: Failing subscribers do not disrupt other subscribers or trigger infinite error loops.
- **Bounded History Buffer**: Configurable FIFO history buffer (default 500) with rich multi-field filtering (`type`, `source`, `correlationId`, `userId`, `time range`, `limit`).
- **Kernel Integration**: Extends `BaseSystemService` (`name: 'event-bus'`) and bridges Kernel lifecycle events via `attachToKernel()`.

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
└── events/
    ├── EventBus.ts
    ├── EventTypes.ts
    ├── EventPayloads.ts
    ├── EventSubscription.ts
    ├── EventHistory.ts
    ├── EventError.ts
    ├── types.ts
    └── index.ts
```

---

## Code Examples

### 1. Initializing Kernel and Registering EventBus

```ts
import { Kernel } from './core/kernel/index.js';
import { EventBus } from './core/events/index.js';

const kernel = new Kernel();
const eventBus = new EventBus();

// Register EventBus as a core OS service
kernel.registerService(eventBus);

// Bridge Kernel lifecycle events into EventBus
eventBus.attachToKernel(kernel);

// Start the OS runtime
await kernel.initialize();
await kernel.start();
```

### 2. Subscribing & Emitting Typed Events

```ts
import { EventBus } from './core/events/index.js';

const eventBus = new EventBus();

// Strongly-typed subscription
const unsubscribe = eventBus.subscribe('FILE_CREATED', (payload, event) => {
  console.log(`Created file ${payload.path} from source ${event.source}`);
});

// Emitting an event
eventBus.emit('FILE_CREATED', {
  path: '/home/user/document.txt',
  size: 2048,
}, {
  source: 'filesystem',
  correlationId: 'tx_9812',
});

// Clean unsubscription
unsubscribe();
```

### 3. Priority and One-Time Listeners

```ts
// High priority shutdown hook
eventBus.subscribe('SYSTEM_STOPPING', async () => {
  console.log('Flushing critical storage buffers...');
}, { priority: 100 });

// One-time listener
eventBus.once('APP_OPENED', (payload) => {
  console.log(`App ${payload.appId} opened for first time`);
});
```

### 4. Querying Event History & Statistics

```ts
// Filter event history
const fsHistory = eventBus.getHistory({
  source: 'filesystem',
  limit: 10,
});

// Get diagnostic statistics
const stats = eventBus.getStats();
console.log(`Total Emitted: ${stats.emittedEvents}, Active Listeners: ${stats.activeListeners}`);
```

---

## Testing & Quality Assurance

```bash
# Run Vitest test suite
npm test

# Run strict TypeScript compiler verification
npm run typecheck

# Build distribution output
npm run build
```
