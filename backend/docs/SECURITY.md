# WebOS Security Architecture & Threat Model (Phase 1)
**Defense-in-Depth, OWASP Top 10 Mitigations & Attack Regression Verification**

---

## 1. Threat Modeling Overview

Phase 1 provides the foundational trust layer of WebOS. The system is designed against the following primary threat vectors:
* **Credential Stuffing & Distributed Brute-Force**: Automated bots attempting high-frequency dictionary attacks.
* **Token Forgery, Tampering & Replay**: Adversaries generating forged tokens or intercepting expired/revoked credentials.
* **Privilege Escalation**: Standard users attempting vertical escalation to administrative roles or horizontal access to other users' virtual desktops.
* **Side-Channel Timing Attacks**: Analysis of response latency variations to infer valid usernames or cryptographic secret fragments.
* **Database Compromise**: Extraction of stored credentials via unauthorized database dumps or SQL injection.

---

## 2. OWASP Top 10 (2021) Defense Matrix

| OWASP Risk | WebOS Phase 1 Mitigation |
|---|---|
| **A01: Broken Access Control** | Declarative route guards (`requirePermission`, `requireRole`, `requireSelfOrPermission`). Strict user ownership checks on session revocation and profile management. |
| **A02: Cryptographic Failures** | Memory-hard `scrypt` hashing with 32-byte cryptographic salts. 256-bit CSPRNG tokens. SHA-256 hashed database storage for all bearer tokens. |
| **A03: Injection** | Strict query abstraction layer using Prisma parameterized statements and Criteria AST. Fastify Zod schema validation on all inputs. |
| **A04: Insecure Design** | Principle of Least Privilege in default role assignments. Progressive account lockout. Dual sliding-window and absolute session expiration. |
| **A05: Security Misconfiguration** | Helmet security headers (HSTS, CSP, X-Content-Type-Options). CORS origin whitelist. Strict Content-Type guarding (`application/json`). |
| **A06: Vulnerable & Outdated Components** | Minimal external dependencies (Zero-dependency token and device parser). Strict semver lockfile audits. |
| **A07: Identification & Authentication Failures** | Progressive lockout after 5 failed attempts. Blacklist of top breached passwords. Shannon entropy scoring. Constant-time verification. |
| **A08: Software & Data Integrity Failures** | Immutable audit logs recorded in `SecurityEvent` repository. Deterministic build pipelines. |
| **A09: Security Logging & Monitoring Failures** | Pino structured JSON logging with automated redaction of sensitive credentials (`authorization`, `token`, `password`, `secret`). |
| **A10: Server-Side Request Forgery (SSRF)** | No backend-orchestrated external URL fetchers enabled in Phase 1 identity services. |

---

## 3. Automated Attack Regression Test Suite

All security protections are backed by automated attack regression tests in `tests/modules/security/security.attacks.test.ts`:

1. **Brute-Force Account Lockout**:
   - 5 consecutive failed logins trigger `ACCOUNT_LOCKED` security event.
   - Subsequent login with correct password is rejected during lockout window.
   - Valid login before threshold resets failed attempt count.
2. **Token Forgery & Tampering**:
   - Fabricated 0-entropy tokens rejected with `401 Unauthorized`.
   - Single-character tampered tokens rejected.
   - Revoked sessions rejected immediately.
   - Sessions exceeding 2 hours of inactivity rejected.
3. **Privilege Escalation Boundaries**:
   - Standard user denied administrative capabilities (`users:delete`, `system:config`).
   - Inactive or suspended user denied API access with immediate session eviction.
4. **Timing Attack Neutralization**:
   - `crypto.timingSafeEqual` verified across constant-length buffers.
5. **Breached Credential Detection**:
   - Top common passwords (`password123`, `admin123`) rejected at registration.
