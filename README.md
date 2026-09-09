# WebOS — Kernel / Core Engine

Central runtime and core service orchestration engine for **WebOS** (Member 2 — OS Core & System Engine).

## Features

- **Service Lifecycle State Machine**: Full lifecycle tracking (`REGISTERED`, `INITIALIZING`, `INITIALIZED`, `STARTING`, `RUNNING`, `STOPPING`, `STOPPED`, `FAILED`).
- **Topological Dependency Resolution**: Directed Acyclic Graph (DAG) ordering with Kahn's algorithm ensuring dependencies start before dependents.
- **Reverse Shutdown Ordering**: Guarantees dependents stop before prerequisites.
- **Cycle Detection**: Automatic cycle detection and exact path reporting (`A -> B -> C -> A`).
- **Rollback on Startup Failure**: Automatically halts and tears down previously started services in reverse order if any downstream service fails during startup.
- **Typed Error Hierarchy**: Granular error types (`MissingDependencyError`, `CircularDependencyError`, `ServiceStartupError`, `KernelTimeoutError`, etc.).
- **System Event Hooks**: Lifecycle event bus hooks (`SYSTEM_INITIALIZING`, `SYSTEM_INITIALIZED`, `SYSTEM_STARTING`, `SYSTEM_STARTED`, `SYSTEM_STOPPING`, `SYSTEM_STOPPED`, `SYSTEM_ERROR`).
- **Extensible SystemService Interface**: `SystemService` contract and `BaseSystemService` abstract class for upcoming core modules (EventBus, Storage, FileSystem, ProcessManager, etc.).

## Directory Structure

```text
core/
└── kernel/
    ├── Kernel.ts
    ├── KernelConfig.ts
    ├── KernelState.ts
    ├── ServiceRegistry.ts
    ├── Service.ts
    ├── ServiceDependency.ts
    ├── KernelError.ts
    ├── types.ts
    └── index.ts
```

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Typecheck
npm run typecheck

# Build
npm run build
```
