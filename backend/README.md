# WebOS Backend Foundation

The **WebOS Backend Foundation** provides a scalable, production-oriented, and strictly typed server architecture powered by Node.js, TypeScript, and Fastify. It establishes the foundational runtime infrastructure for WebOS, including centralized configuration, structured error handling, request-scoped context, structured logging, health checks with an extensible registry, security defaults, validation pipelines, and graceful shutdown lifecycle management.

---

## 1. Architecture Overview

```text
Incoming HTTP Request
        │
        ▼
[Fastify Server Instance]
        │
        ├─► [Security Middleware] (Helmet secure headers, CORS origin filtering)
        │
        ├─► [Request Context Middleware] (Assigns/extracts UUID v4 Request ID, seeds AsyncLocalStorage)
        │
        ├─► [Timing & Response Middleware] (Server-Timing, X-Response-Time, standardized JSON envelopes)
        │
        ├─► [Request Lifecycle Logger] (Monotonic duration tracking, structured JSON logs)
        │
        ▼
[Centralized Router]
        │
        ├─► /health          (Fast process-level health status)
        ├─► /health/live     (Process liveness probe)
        ├─► /health/ready    (Dependency readiness probe via HealthCheckRegistry)
        │
        └─► /api/v1          (Versioned REST API root and extension point)
                │
                ▼
        [Route Handlers]
                │
                ▼
        [Domain Services] (BaseService contracts)
                │
                ▼
        [Repositories] (IRepository / AbstractRepository interfaces)
```

---

## 2. Directory Structure

```text
backend/
├── src/
│   ├── index.ts                      # Main process bootstrap & exports
│   │
│   ├── server/                       # Server Lifecycle & Factory
│   │   ├── app.ts                    # createApp() Fastify application factory
│   │   ├── server.ts                 # startServer() network listener & bootstrap
│   │   ├── config.ts                 # Typed immutable configuration loader
│   │   ├── routes.ts                 # Centralized route & versioning registration
│   │   ├── lifecycle.ts              # Server lifecycle hooks orchestrator
│   │   └── shutdown.ts               # Graceful shutdown manager (SIGINT/SIGTERM)
│   │
│   ├── common/
│   │   ├── config/                   # Configuration schemas & validators
│   │   │   ├── config.types.ts       # Strongly typed config interfaces
│   │   │   ├── config.schema.ts      # Zod validation schema & environment parser
│   │   │   └── env.validator.ts      # Fail-fast startup validator with diagnostic errors
│   │   │
│   │   ├── errors/                   # Structured Error Hierarchy & Handlers
│   │   │   ├── app-error.ts          # Base AppError class
│   │   │   ├── error-codes.ts        # Reusable ErrorCode taxonomy
│   │   │   ├── specific-errors.ts    # ValidationError, NotFoundError, UnauthorizedError, etc.
│   │   │   ├── error-serializer.ts   # Secure error serialization (no secret/path leakage)
│   │   │   ├── error-handler.ts      # Fastify global error handler
│   │   │   └── not-found-handler.ts  # Fallback 404 handler for unknown routes
│   │   │
│   │   ├── logging/                  # Structured Logging Subsystem
│   │   │   ├── logger.ts             # Pino logger setup with dev & prod presets
│   │   │   ├── log-context.ts        # AsyncLocalStorage request-scoped metadata store
│   │   │   ├── log-redaction.ts      # Sensitive field & header redaction rules
│   │   │   └── request-logger.ts     # Request lifecycle hooks (onRequest, onResponse)
│   │   │
│   │   ├── middleware/               # Middleware & Hooks
│   │   │   ├── request-context.ts    # RequestContext decorator & request ID propagation
│   │   │   ├── security.ts           # CORS and Helmet secure HTTP headers
│   │   │   ├── response.ts           # Standardized JSON response envelope
│   │   │   ├── timing.ts             # Server-Timing and duration response headers
│   │   │   └── content-type.ts       # Strict Content-Type parser & payload guard
│   │   │
│   │   ├── validation/               # Request Validation Foundation
│   │   │   ├── types.ts              # RequestValidationSchema & ValidationIssue types
│   │   │   ├── validation-error.ts   # Zod-to-AppError validation mapper
│   │   │   ├── validation-utils.ts   # Common Zod field schemas & type guards
│   │   │   └── schema-validator.ts   # Fastify preValidation hook factory
│   │   │
│   │   ├── types/                    # Common System Types
│   │   │   ├── common.ts             # Result<T, E>, PaginatedResponse, utilities
│   │   │   ├── http.types.ts         # HttpStatus, HttpMethod, HttpHeader constants
│   │   │   ├── context.types.ts      # RequestContext, ClientMetadata
│   │   │   └── fastify.d.ts          # Fastify type augmentations
│   │   │
│   │   └── utils/                    # Core Utilities
│   │       ├── id.ts                 # UUID v4 and compact nanoid generation
│   │       ├── time.ts               # High-resolution monotonic timers & ISO formatting
│   │       ├── object.ts             # Deep freeze, deep clone, mask, pick/omit
│   │       └── string.ts             # Normalization, case conversion, safe truncation
│   │
│   ├── health/                       # Health Monitoring Subsystem
│   │   ├── health.types.ts           # HealthStatus, ComponentHealth, HealthReport types
│   │   ├── health.registry.ts        # Extensible HealthCheckRegistry for future modules
│   │   ├── health.service.ts         # Process health & readiness coordination
│   │   ├── health.routes.ts          # GET /health, /health/live, /health/ready
│   │   └── checks/
│   │       ├── process-health.ts     # Memory heap, RSS, uptime, and PID monitoring
│   │       └── system-health.ts      # Event loop lag & platform check
│   │
│   ├── services/                     # Service Contracts
│   │   ├── service.types.ts          # IService interface & ServiceState lifecycle enum
│   │   ├── base.service.ts           # BaseService abstract class
│   │   └── service.registry.ts       # Service container & initialization coordinator
│   │
│   └── repositories/                 # Repository Contracts
│       ├── query.types.ts            # QueryOptions, SortCriteria, FilterCriteria
│       ├── repository.interface.ts   # Generic IRepository<T, ID, Filter> contract
│       └── base.repository.ts        # Abstract BaseRepository pagination helper
│
├── tests/                            # Vitest Test Suite
│   ├── helpers/                      # Test harness & Fastify inject helper
│   ├── unit/                         # Unit tests (Config, Errors, Logger, Utils, Validation)
│   ├── integration/                  # Integration tests (App Factory, Health, Routes, Security)
│   └── e2e/                          # E2E tests (Live network port listening & shutdown)
│
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── vitest.config.ts
├── .eslintrc.json
├── .env.example
└── README.md
```

---

## 3. Technology Stack

- **Runtime:** Node.js (>=20.0.0, tested on Node v24)
- **Language:** TypeScript 5.4+ (Strict mode: `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `strictNullChecks`)
- **Web Framework:** Fastify 4.28+
- **Logging:** Pino 9+ (with `pino-pretty` in development)
- **Validation:** Zod 3.23+
- **Security:** `@fastify/helmet` & `@fastify/cors`
- **Testing:** Vitest 1.6+

---

## 4. Installation & Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

---

## 5. Configuration & Environment Variables

All configuration is centralized and validated at startup using Zod schemas. Invalid configuration halts startup immediately with descriptive issue locations.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `development` \| `production` \| `test` | `development` | Target execution environment |
| `HOST` | string | `127.0.0.1` | Network interface IP address to bind |
| `PORT` | number (1-65535) | `3000` | Port number to listen on |
| `LOG_LEVEL` | `trace` \| `debug` \| `info` \| `warn` \| `error` \| `fatal` | `info` | Minimum log level for Pino logger |
| `CORS_ORIGIN` | comma-separated string \| `*` | `http://localhost:3000,http://127.0.0.1:3000` | Allowed CORS origin URLs |

---

## 6. Development & Build Commands

```bash
# Run in development mode with live reload
npm run dev

# Compile TypeScript to dist/ for production
npm run build

# Run production build from dist/
npm start

# Run strict TypeScript typechecking
npm run typecheck

# Run ESLint linter
npm run lint

# Run all test suites (unit, integration, e2e)
npm test

# Run tests with live watch mode
npm run test:watch

# Run tests with test coverage reporting
npm run test:coverage
```

---

## 7. Health Monitoring Endpoints

The health subsystem provides three dedicated endpoints:

### `GET /health`
Fast process-level health check. Does not depend on external services.
```json
{
  "status": "ok",
  "service": "webos-backend",
  "version": "0.1.0",
  "timestamp": "2026-09-09T06:15:00.000Z",
  "uptimeSeconds": 42
}
```

### `GET /health/live`
Kubernetes/container liveness probe. Confirms process is responsive.
```json
{
  "status": "ok",
  "alive": true,
  "pid": 12345,
  "uptimeSeconds": 42,
  "timestamp": "2026-09-09T06:15:00.000Z"
}
```

### `GET /health/ready`
Readiness probe verifying all registered subsystem checks in `HealthCheckRegistry`. Returns HTTP 200 when ready or HTTP 503 when any critical check fails.
```json
{
  "status": "ok",
  "ready": true,
  "service": "webos-backend",
  "version": "0.1.0",
  "timestamp": "2026-09-09T06:15:00.000Z",
  "checks": [
    {
      "name": "backend-foundation",
      "status": "healthy",
      "durationMs": 0.45,
      "timestamp": "2026-09-09T06:15:00.000Z",
      "critical": true,
      "details": {
        "subsystem": "backend-foundation",
        "eventLoopLagMs": 0.12
      }
    },
    {
      "name": "process-memory",
      "status": "healthy",
      "durationMs": 0.15,
      "timestamp": "2026-09-09T06:15:00.000Z",
      "critical": false,
      "details": {
        "heapUsedMb": "32.45",
        "heapTotalMb": "45.10",
        "rssMb": "68.20",
        "nodeVersion": "v24.20.0"
      }
    }
  ]
}
```

---

## 8. Response & Error Contracts

### Standard Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found",
    "requestId": "9c104230-1c58-450f-90e6-b60b45df869a",
    "details": { ... }
  }
}
```

- Production error responses **never** leak stack traces, database internals, private filesystem paths, or secrets.
- Every error contains the `requestId` matching the `x-request-id` response header for audit tracing.

### Error Code Taxonomy
- `BAD_REQUEST` (400)
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `RESOURCE_NOT_FOUND` (404)
- `ROUTE_NOT_FOUND` (404)
- `METHOD_NOT_ALLOWED` (405)
- `CONFLICT` (409)
- `PAYLOAD_TOO_LARGE` (413)
- `UNSUPPORTED_MEDIA_TYPE` (415)
- `INTERNAL_ERROR` (500)
- `BAD_GATEWAY` (502)
- `SERVICE_UNAVAILABLE` (503)

---

## 9. Graceful Shutdown

On receiving `SIGINT` or `SIGTERM`:
1. The server enters shutdown mode (`isShuttingDown = true`).
2. Phase `beforeShutdown` hooks run.
3. Fastify stops accepting new socket connections and drains in-flight requests.
4. Phase `afterShutdown` hooks run (for closing database pools, flush caches).
5. A safety timeout (default 10s) guarantees the process terminates if cleanup hangs.
6. The process exits cleanly with code 0.
