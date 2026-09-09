# WebOS Multi-Device Session Management (Module 6)
**Device Telemetry, Sliding-Window Lifecycle & High-Assurance Revocation**

---

## 1. Multi-Device Tracking & Telemetry Parser

WebOS treats virtual OS sessions as first-class, device-aware entities. Every session record is linked to a `SessionDevice` record extracted via `DeviceParser`:

* **Device Type**: `desktop`, `mobile`, `tablet`, or `bot`.
* **Browser & Version**: Chrome, Firefox, Safari, Microsoft Edge, Opera, or curl.
* **Operating System & Version**: Windows 10/11, macOS, iOS, Android, Linux, ChromeOS.
* **CPU Architecture**: `x86_64`, `arm64`, `arm`, or `x86`.

Telemetry extraction is performed with zero external dependencies and zero network roundtrips.

---

## 2. Dual Sliding-Window & Absolute Session Lifecycle

Every session operates under two concurrent timing policies:

```
Login Time                                                     Absolute Expiry (30 Days)
  │                                                                       │
  ▼───────────────────────────────────────────────────────────────────────▼
  [═══════════════════════════════════════════════════════════════════════]
       ▲                        ▲
       │                        │
       └──── Inactivity Window ─┘ (2 Hours from Last Activity)
```

1. **Inactivity Sliding Window (Default: 2 Hours)**:
   - Every authenticated API request updates `lastActiveAt`.
   - If the duration between the current time and `lastActiveAt` exceeds 2 hours, the session status transitions to `EXPIRED` and subsequent requests are rejected with `401 Unauthorized`.
2. **Absolute Maximum Lifetime (Default: 30 Days)**:
   - Regardless of ongoing activity, a session expires permanently after 30 days, requiring re-authentication to prevent indefinite token persistence.

---

## 3. Concurrent Device Limits & Oldest-Session Eviction

To prevent session proliferation and abandoned tokens:
* **Max Concurrent Sessions**: Configurable per system (default: 5).
* **Automated Eviction**: When a user logs in and already has 5 active sessions, the session manager automatically identifies and marks the **oldest active session** as `REVOKED` (Reason: `Concurrent session limit exceeded`).

---

## 4. Session Revocation Protocols

### 1. Self Single-Session Revocation (`POST /api/v1/auth/logout` or `DELETE /api/v1/sessions/:id`)
A user can log out of their current device or terminate a specific remote device session.

### 2. Revoke All Other Sessions (`POST /api/v1/sessions/revoke-others`)
Terminates all active sessions for the user across all devices except the current active session.

### 3. Mass Account Eviction (Status Change / Security Alerts)
When an administrator suspends, deactivates, or locks an account, `SessionService.revokeAllUserSessions()` immediately invalidates every active session across all devices.

---

## 5. Middleware Authentication Hook

Fastify route preHandlers utilize `createSessionAuthHook()`:
1. Checks `Authorization: Bearer <token>` header.
2. Falls back to `Cookie: webos_session=<token>` if authorization header is absent.
3. Computes SHA-256 hash of the token.
4. Queries session repository for active token hash.
5. Validates sliding window and absolute expiration.
6. Enriches `request.requestContext` with `userId`, `sessionId`, and `roles`.
