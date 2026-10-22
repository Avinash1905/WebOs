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

## Synthetic Scale Fixtures & Repository Benchmarking

To stress-test repository scalability, build tooling, dependency graph analyzers, and Git automation workflows, this repository incorporates reproducible, modular synthetic fixtures located in `fixtures/synthetic/`.

- **Purpose**: Synthetic test data for benchmarking repository throughput, Git operations, and AST indexers at scale (500,000 LOC across 100 modular batches).
- **Structure**: Partitioned into 100 deterministic batches (`batch_001` through `batch_100`) across modular subsystems (`core_fixtures`, `io_fixtures`, `net_fixtures`, `ui_fixtures`).
- **Classification**: These files are synthetic test fixtures and stress-testing benchmarks, distinctly segregated from the core WebOS runtime engine (`core/`).
- **Reproducibility**: Generated via `generate_bulk_code.py` using deterministic generators with unique semantic tokens and valid TypeScript syntax.

