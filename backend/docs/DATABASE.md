# WebOS Database Layer Architecture & Reference (Module 2)
**PostgreSQL & Prisma ORM Dual-Adapter Persistence**

---

## 1. Overview

The WebOS Phase 1 database layer is engineered for enterprise-grade scalability, complete ACID compliance, and testability. It features:
1. **Full PostgreSQL 16 Schema**: 13 strongly typed models mapped via Prisma ORM.
2. **Dual-Adapter Pattern**: 100% interchangeable `PrismaDatabase` and `InMemoryDatabase` conforming to identical repository interfaces.
3. **Resilient Transactions**: Automatic exponential backoff retry on transient transaction serialization failures and deadlocks (`40P01`, `40001`, `P2034`).
4. **Zero Test Daemon Requirement**: Unit and integration test suites run fully in-memory with zero mock drift or network roundtrips.

---

## 2. Entity Data Dictionary

| Model | Table Name | Purpose | Primary Key | Key Indexes |
|---|---|---|---|---|
| `User` | `users` | Core user identity & authentication credentials | UUID | `email` (unique), `username` (unique), `status` |
| `UserProfile` | `user_profiles` | Profile metadata, theme, and desktop configuration | UUID | `userId` (unique) |
| `Role` | `roles` | RBAC role definitions (Admin, User, etc.) | UUID | `name` (unique) |
| `Permission` | `permissions` | Granular capability definitions | UUID | `name` (unique), `resource`, `action` |
| `UserRole` | `user_roles` | Many-to-many user-role assignments | UUID | `[userId, roleId]` (unique compound) |
| `RolePermission` | `role_permissions` | Many-to-many role-permission assignments | UUID | `[roleId, permissionId]` (unique compound) |
| `Session` | `sessions` | Active and historical user login sessions | UUID | `tokenHash` (unique), `[userId, status]` |
| `SessionDevice` | `session_devices` | Telemetry & device metadata per session | UUID | `sessionId` (unique) |
| `AuthenticationAttempt`| `authentication_attempts`| Brute-force tracking & lockout telemetry | UUID | `[identifier, attemptedAt]`, `ipAddress` |
| `PasswordResetToken` | `password_reset_tokens`| Cryptographic password reset tokens | UUID | `tokenHash` (unique), `userId` |
| `EmailVerificationToken`| `email_verification_tokens`| Account activation tokens | UUID | `tokenHash` (unique), `userId` |
| `SecurityEvent` | `security_events` | Immutable security audit event trail | UUID | `userId`, `eventType`, `occurredAt` |
| `LoginHistory` | `login_histories` | Historical login records for user security view | UUID | `[userId, loginAt]` |

---

## 3. Relationships & Cascade Rules

* **User → UserProfile**: One-to-One. Cascade delete enabled (`onDelete: Cascade`).
* **User → Sessions**: One-to-Many. Deleting a user cascade-deletes all associated sessions.
* **Session → SessionDevice**: One-to-One. Cascade delete enabled.
* **User → UserRoles → Role**: Many-to-Many junction table. Deleting a user or role cascades junction entries without deleting the opposite entity.
* **Role → RolePermissions → Permission**: Many-to-Many junction table. Deleting a role cascades junction entries.

---

## 4. Transaction Management & Deadlock Retry

PostgreSQL transactions with isolation level `RepeatableRead` or `Serializable` can encounter concurrency conflicts (`40001` Serialization Failure) or deadlocks (`40P01` Deadlock Detected). 

The `TransactionManager` provides automated resilience:

```typescript
export class TransactionManager {
  public async runWithRetry<T>(
    action: (tx: IPrismaClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    let delay = options.initialBackoffMs ?? 50;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(action, {
          timeout: options.timeoutMs ?? 10000,
          maxWait: options.maxWaitMs ?? 5000,
          isolationLevel: options.isolationLevel ?? 'ReadCommitted'
        });
      } catch (err: unknown) {
        if (this.isTransientDeadlock(err) && attempt < maxRetries) {
          const jitter = Math.floor(Math.random() * 20);
          await new Promise((r) => setTimeout(r, delay + jitter));
          delay *= 2;
          continue;
        }
        throw err;
      }
    }
  }
}
```

---

## 5. Dual-Adapter Repository Architecture

Every domain repository implements an explicit interface:

```
                  ┌──────────────────────┐
                  │   IUserRepository    │
                  └──────────▲───────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
┌───────────────────────┐         ┌───────────────────────┐
│  PrismaUserRepository │         │ InMemoryUserRepository│
└───────────────────────┘         └───────────────────────┘
```

Both adapters implement criteria filtering AST:
- Equality, inequality, partial text matching (`contains`), and set operations (`in`).
- Safe offset-and-limit pagination.
- Multi-field sort criteria.
