# WebOS REST API Reference (v1)
**Complete Endpoint Specifications, Envelopes & Error Contracts**

---

## 1. Global Request & Response Conventions

### Success Envelope
All successful API responses return HTTP 200/201 with the standard envelope:
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Envelope
All error responses return HTTP 4xx/5xx with the standard envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable error description",
    "requestId": "93d4d865-30a9-4890-a4f5-f587b815a3f3",
    "details": [ ... ]
  }
}
```

---

## 2. Authentication Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/register`
* **Access**: Public
* **Payload**:
  ```json
  {
    "username": "janedoe",
    "email": "jane@webos.local",
    "password": "StrongPassword!2026",
    "displayName": "Jane Doe"
  }
  ```
* **Response (201)**: Returns user summary, initial session token, and expiry timestamp.

### `POST /api/v1/auth/login`
* **Access**: Public
* **Payload**:
  ```json
  {
    "identifier": "jane@webos.local",
    "password": "StrongPassword!2026"
  }
  ```
* **Response (200)**: Issues 256-bit session token and user roles.

### `POST /api/v1/auth/logout`
* **Access**: Authenticated (Bearer Token or Cookie)
* **Response (200)**: Revokes active session and logs audit event.

### `POST /api/v1/auth/forgot-password`
* **Access**: Public
* **Payload**: `{ "email": "jane@webos.local" }`
* **Response (200)**: Dispatches password reset token link.

### `POST /api/v1/auth/reset-password`
* **Access**: Public
* **Payload**: `{ "token": "<reset_token>", "newPassword": "<new_strong_password>" }`

### `POST /api/v1/auth/change-password`
* **Access**: Authenticated
* **Payload**: `{ "currentPassword": "...", "newPassword": "..." }`

### `POST /api/v1/auth/verify-email`
* **Access**: Public
* **Payload**: `{ "token": "<verification_token>" }`

---

## 3. User Management Endpoints (`/api/v1/users`)

### `GET /api/v1/users/me`
* **Access**: Authenticated
* **Response (200)**: Detailed user profile, roles, and metadata.

### `PATCH /api/v1/users/me/profile`
* **Access**: Authenticated
* **Payload**: `{ "displayName": "New Name", "bio": "...", "theme": "dark" }`

### `GET /api/v1/users/me/desktop`
* **Access**: Authenticated
* **Response (200)**: Virtual desktop wallpaper, icon positions, theme.

### `PUT /api/v1/users/me/desktop`
* **Access**: Authenticated
* **Payload**: Updates wallpaper, desktop layout, and sound preferences.

### `GET /api/v1/users` (Admin)
* **Access**: Requires `users:read` or `ADMIN` role
* **Query Params**: `page`, `limit`, `search`, `status`

### `PATCH /api/v1/users/:id/status` (Admin)
* **Access**: Requires `users:manage` or `ADMIN` role
* **Payload**: `{ "status": "SUSPENDED", "reason": "Security review" }`

---

## 4. Role & Permission Endpoints (`/api/v1/roles`, `/api/v1/permissions`)

### `GET /api/v1/roles`
* **Access**: Authenticated
* **Response (200)**: Lists all configured RBAC roles.

### `POST /api/v1/roles` (Admin)
* **Access**: Requires `roles:manage`
* **Payload**: `{ "name": "AUDITOR", "displayName": "Auditor", "description": "..." }`

### `GET /api/v1/permissions/me`
* **Access**: Authenticated
* **Response (200)**: Evaluated permissions and roles for current session.

---

## 5. Session Management Endpoints (`/api/v1/sessions`)

### `GET /api/v1/sessions/me`
* **Access**: Authenticated
* **Response (200)**: Lists all active sessions for current user with device telemetry and `isCurrent` indicator.

### `DELETE /api/v1/sessions/:id`
* **Access**: Authenticated (Owner or Admin)
* **Response (200)**: Immediately revokes target session.

### `POST /api/v1/sessions/revoke-others`
* **Access**: Authenticated
* **Response (200)**: Terminates all active sessions except the current session.
