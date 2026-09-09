# WebOS Phase 1 — Architecture & System Design
**Modules 2–6: Database, Identity, Authentication, Authorization & Session Management**

---

## 1. Executive Architectural Overview

WebOS is an enterprise-grade virtual operating system running in modern web browsers. Phase 1 establishes the bedrock backend infrastructure:
* **Module 2**: Dual-adapter PostgreSQL database layer using Prisma ORM and high-fidelity In-Memory repositories with ACID transactions and automatic deadlock retry.
* **Module 3**: Cryptographic authentication and password security engine powered by native `scrypt`, constant-time timing-safe comparison, breached credential protection, and progressive lockout.
* **Module 4**: User account management, user profiles, virtual desktop preferences (wallpapers, window managers, themes), and administrative account state transitions.
* **Module 5**: Role-Based Access Control (RBAC) with granular permission catalogs, hierarchical role inheritance, superuser wildcard evaluation, and an in-memory LRU permission cache.
* **Module 6**: Multi-device session management with zero-dependency User-Agent telemetry parsing, dual sliding-window and absolute session expiration, and instant single or mass session revocation.

---

## 2. Clean Architecture & Layer Separation

The WebOS backend strictly adheres to Clean Architecture principles:

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP & Network Layer                     │
│  Fastify Plugins, Route Handlers, Route Guards, Envelopes  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Domain Service Layer                     │
│   AuthService, UserService, RbacService, SessionService    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                Repository Abstraction Layer                 │
│    IUserRepository, ISessionRepository, IRoleRepository...  │
└──────────────────────────────┬──────────────────────────────┘
                               │
          ┌────────────────────┴────────────────────┐
          ▼                                         ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│     Prisma ORM Adapter       │   │     In-Memory Adapter        │
│  PostgreSQL Production Pool  │   │   Zero-External-Daemon Test  │
└──────────────────────────────┘   └──────────────────────────────┘
```

### Key Design Invariants:
1. **Dependency Inversion**: Domain services depend *only* on repository interfaces (`IUserRepository`, `ISessionRepository`, etc.) defined in `src/modules/database/database.types.ts`. Services never import concrete Prisma client instances or in-memory stores.
2. **Dual Data Adapters**: Every repository implements both an `InMemory*` and a `Prisma*` implementation. All 155+ unit and integration tests run entirely in-memory with zero external daemon dependencies, while production runs on PostgreSQL.
3. **Composition Root**: The dependency graph is assembled exclusively in `src/modules/phase1.container.ts` via the factory function `createPhase1Services()`.
4. **Context Propagation**: Fastify request lifecycle middleware attaches authenticated credentials (`userId`, `sessionId`, `roles`) to `request.requestContext`.

---

## 3. Module Breakdown & Responsibilities

### Module 2: Database & Transactions
* **Data Models**: 13 first-class models: `User`, `UserProfile`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Session`, `SessionDevice`, `AuthenticationAttempt`, `PasswordResetToken`, `EmailVerificationToken`, `SecurityEvent`, `LoginHistory`.
* **ACID Transactions**: Executed via `TransactionManager.runWithRetry()` with exponential backoff on transient deadlock codes (`40P01`, `40001`, `P2034`).
* **Health Probing**: Real-time database readiness and latency probes integrated into the core WebOS `HealthRegistry`.

### Module 3: Authentication & Password Security
* **Key Derivation**: `scrypt` (cost: 16384, block size: 8, parallelism: 1, 32-byte salt, 64-byte key) with timing-safe comparison to neutralize timing side-channel attacks.
* **Progressive Lockout**: Tracks failed attempts across a 15-minute sliding window; locks account for 15 minutes after 5 failures.
* **Audit Trail**: Every registration, login, logout, password change, and lockout event is immutably recorded in `SecurityEvent` repository.

### Module 4: User Management & Desktop Profiles
* **Virtual Desktop State**: Stores user wallpaper, theme (light, dark, cyberpunk), desktop icon coordinates, and notification preferences.
* **Status Enforcement**: Administrative transitions (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`, `LOCKED`). Suspending or deactivating a user immediately evicts all active sessions across all devices.
* **Self-Deletion Protection**: Prevents administrators from deleting or suspending their own accounts.

### Module 5: Authorization & RBAC
* **Granular Catalog**: Over 20 system permissions across domains (`users:*`, `roles:*`, `permissions:*`, `files:*`, `apps:*`, `system:*`).
* **Hierarchical Roles**: Built-in hierarchy `SUPERADMIN > ADMIN > DEVELOPER > USER > GUEST`.
* **Wildcard Resolution**: Superusers possessing `*` or `users:*` automatically satisfy subordinate permission checks.
* **LRU Permission Cache**: High-performance in-memory cache with configurable TTL (default: 60s) and instant invalidation on role or permission mutations.

### Module 6: Session Management & Multi-Device Tracking
* **Telemetry**: Native `DeviceParser` extracts device type (desktop, mobile, tablet), browser, version, operating system, and CPU architecture.
* **Expiration Engine**: Dual expiration tracking:
  - **Inactivity Timeout**: 2 hours of inactivity marks session expired.
  - **Absolute Lifetime**: 30 days maximum lifetime from initial login.
* **Concurrency Control**: Enforces maximum simultaneous sessions per user (default: 5) by automatically revoking the oldest active session.

---

## 4. Production Directory Layout

```
backend/
├── prisma/
│   ├── schema.prisma                     # Complete 13-model Prisma schema
│   └── migrations/
│       └── 20260909000000_init_phase1/  # Production PostgreSQL DDL migration
├── src/
│   ├── common/                          # Module 1 foundation (errors, config, logger, etc.)
│   ├── modules/
│   │   ├── database/                    # Module 2: DB types, Prisma service, Repositories
│   │   │   ├── repositories/
│   │   │   │   ├── in-memory/           # 13 In-memory repositories & unit of work
│   │   │   │   └── prisma/              # 13 Prisma repositories & unit of work
│   │   │   ├── database.types.ts
│   │   │   ├── prisma.types.ts
│   │   │   ├── transaction.manager.ts
│   │   │   └── database.health.ts
│   │   ├── auth/                        # Module 3: Authentication & Security
│   │   │   ├── crypto/                  # Hasher, validator, token generator
│   │   │   ├── lockout/                 # Sliding-window lockout manager
│   │   │   ├── security-events/         # Centralized security audit recorder
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.routes.ts
│   │   ├── users/                       # Module 4: User & Profile Management
│   │   │   ├── user.service.ts
│   │   │   ├── user.controller.ts
│   │   │   └── user.routes.ts
│   │   ├── rbac/                        # Module 5: Authorization & RBAC
│   │   │   ├── permission.catalog.ts    # Canonical permissions & roles
│   │   │   ├── permission.cache.ts      # LRU cache with TTL
│   │   │   ├── role-hierarchy.service.ts
│   │   │   ├── rbac.guards.ts           # Fastify preHandler route guards
│   │   │   ├── rbac.service.ts
│   │   │   ├── rbac.controller.ts
│   │   │   └── rbac.routes.ts
│   │   ├── sessions/                    # Module 6: Session Management
│   │   │   ├── device-parser.ts         # User-Agent telemetry parser
│   │   │   ├── session.service.ts
│   │   │   ├── session.middleware.ts    # Context enrichment hook
│   │   │   ├── session.controller.ts
│   │   │   └── session.routes.ts
│   │   └── phase1.container.ts          # Composition Root & DI container
│   ├── server/                          # App factory, routes, lifecycle
│   └── index.ts                         # Server entrypoint & public exports
└── tests/
    ├── helpers/                         # Test harness & config mocks
    ├── unit/                            # Foundation unit tests (Module 1)
    ├── integration/                     # Foundation integration tests (Module 1)
    ├── e2e/                             # Foundation e2e tests (Module 1)
    └── modules/                         # Phase 1 domain test suites
        ├── auth/                        # Hasher, tokens, auth service tests
        ├── users/                       # User management & profile tests
        ├── rbac/                        # RBAC & permission tests
        ├── sessions/                    # Session & device parser tests
        ├── security/                    # Security attack regression tests
        └── api/                         # Phase 1 HTTP API integration tests
```
