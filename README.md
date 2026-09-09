# WebOS Operating System

A modern, high-performance browser-based operating system built with React 19, TypeScript, Vite, and modular OS services.

## System Architecture

```text
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

## Team Responsibilities

- **Member 1**: Desktop Environment & UI System (Desktop Shell, Window Manager, Taskbar, Start Menu, Application Launcher, UI Component Library, Theme Engine)
- **Member 2**: OS Core & Kernel Services (Kernel, Event Bus, Storage Engine, Virtual File System)
- **Member 3**: Built-in Applications & Productivity Suite (File Manager, Text Editor, Notes, Document Editor)
- **Member 4**: Backend & Cloud Sync

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Run Typecheck
```bash
npm run typecheck
```

### Build Production Bundle
```bash
npm run build
```
