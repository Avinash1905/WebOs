# WebOS Testing Strategy & Test Suites
**100% In-Memory Test Execution, Security Attack Verification & Continuous Quality**

---

## 1. Testing Philosophy

The WebOS backend testing suite is built around three core principles:
1. **Zero External Daemon Dependencies**: Tests run instantly in any local environment or CI runner without running PostgreSQL or Docker daemons.
2. **Dual-Adapter Verification**: High-fidelity in-memory repositories provide identical semantics to PostgreSQL, ensuring fast, deterministic test runs.
3. **Attack-Driven Security Testing**: Dedicated regression test suites simulate adversary attack vectors against the identity and authorization boundaries.

---

## 2. Test Suite Breakdown

The repository contains 20 test suites and 155 automated tests:

| Category | Path | Tests | Purpose |
|---|---|---|---|
| **Foundation Unit** | `tests/unit/*.test.ts` | 51 | Config parsing, logging, error serialization, health registry, ID utils |
| **Foundation Integration** | `tests/integration/*.test.ts` | 25 | Fastify app factory, security middleware, error handlers, route versioning |
| **Foundation E2E** | `tests/e2e/lifecycle.test.ts` | 1 | Server startup, signal handling (`SIGINT`, `SIGTERM`), graceful shutdown |
| **Auth Domain Unit** | `tests/modules/auth/crypto.test.ts` | 15 | `scrypt` key derivation, PBKDF2 fallback, password entropy, token generation |
| **Auth Service** | `tests/modules/auth/auth.service.test.ts` | 13 | Registration, login, lockout counters, password resets, verification |
| **User Service** | `tests/modules/users/user.service.test.ts` | 8 | User profiles, desktop preferences, administrative status changes, evictions |
| **RBAC Service** | `tests/modules/rbac/rbac.service.test.ts` | 8 | Role hierarchies, permission evaluations, wildcard matching, LRU cache |
| **Session Service** | `tests/modules/sessions/session.service.test.ts` | 12 | Device parsing, sliding-window expiration, absolute expiration, concurrency limits |
| **Security Attacks** | `tests/modules/security/security.attacks.test.ts` | 12 | Brute-force lockout, token forgery, privilege escalation, timing defenses |
| **HTTP API Integration**| `tests/modules/api/phase1.integration.test.ts` | 10 | End-to-end HTTP API contracts, session cookies, route guards, envelopes |

**Total: 20 Test Files | 155 Tests Passing (100% Pass Rate)**

---

## 3. Running Test Suites

```bash
# Run all test suites
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with code coverage report
npm run test:coverage

# Run specific test file
npx vitest run tests/modules/security/security.attacks.test.ts
```
