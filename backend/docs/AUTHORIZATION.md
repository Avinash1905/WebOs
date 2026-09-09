# WebOS Authorization & Role-Based Access Control (Module 5)
**Granular Permission Catalog, Role Hierarchy & LRU Authorization Engine**

---

## 1. System Role Hierarchy

WebOS implements a layered role model with strict rank inheritance:

```
SUPERADMIN (Weight: 500)
    │
    ▼
  ADMIN    (Weight: 400)
    │
    ▼
DEVELOPER  (Weight: 300)
    │
    ▼
  USER     (Weight: 200)
    │
    ▼
  GUEST    (Weight: 100)
```

Higher-ranking roles inherit all capabilities of subordinate roles. A user assigned the `ADMIN` role automatically possesses all permissions granted to `DEVELOPER`, `USER`, and `GUEST`.

---

## 2. Granular System Permissions Catalog

Permissions follow the standard `resource:action` naming convention:

| Domain | Permission | Description | Default Roles |
|---|---|---|---|
| **Users** | `users:read` | View profiles and listings | Admin, Developer, User |
| | `users:create` | Create new user accounts | Admin |
| | `users:update` | Edit user profile and properties | Admin |
| | `users:delete` | Delete user accounts | Admin |
| | `users:manage` | Complete administrative user control | Admin, Superadmin |
| **Roles** | `roles:read` | Inspect role definitions | Admin, Developer |
| | `roles:manage` | Create, modify, and assign roles | Superadmin, Admin |
| **Permissions** | `permissions:read` | View system permission catalog | Admin, Developer, User |
| | `permissions:manage` | Grant or revoke permissions | Superadmin |
| **Files** | `files:read` | Read virtual filesystem files | Admin, Developer, User |
| | `files:write` | Create and edit files | Admin, Developer, User |
| | `files:delete` | Delete virtual files | Admin, Developer, User |
| | `files:share` | Share files across WebOS users | Admin, User |
| **Applications**| `apps:read` | List and launch installed apps | Admin, Developer, User, Guest |
| | `apps:install` | Install new WebOS web applications | Admin, Developer |
| | `apps:manage` | Configure or remove applications | Admin |
| **System** | `system:metrics` | Read system performance metrics | Admin, Developer |
| | `system:config` | Modify global OS configurations | Superadmin |
| | `*` | Superuser global wildcard | Superadmin |

---

## 3. Wildcard Resolution Engine

The `RbacService` supports hierarchical wildcard matching:
* `*`: Superuser wildcard matching any permission.
* `users:*`: Matches all actions under the `users` resource (`users:read`, `users:update`, `users:delete`, etc.).
* `files:*`: Matches all virtual filesystem operations.

```typescript
export function matchesPermission(granted: string, required: string): boolean {
  if (granted === '*' || granted === required) return true;
  if (granted.endsWith(':*')) {
    const prefix = granted.slice(0, -2);
    return required.startsWith(`${prefix}:`);
  }
  return false;
}
```

---

## 4. High-Performance LRU Permission Cache

Evaluating user permissions on every HTTP request can introduce significant database overhead. 

WebOS integrates an in-memory LRU permission cache:
* **Capacity**: 1,000 entries.
* **Time-to-Live (TTL)**: 60 seconds.
* **Instant Invalidation**: Mutations to `roles`, `permissions`, `user_roles`, or `role_permissions` immediately invalidate affected user caches.

---

## 5. Fastify Route Guards

Declarative route guards protect API endpoints:

```typescript
// Enforce single granular permission
users.delete('/:id', { preHandler: requirePermission(rbacService, 'users:delete') }, controller.deleteUser);

// Enforce specific role rank
roles.post('/', { preHandler: requireRole(rbacService, 'ADMIN') }, controller.createRole);

// Enforce self-access or administrative permission
users.get('/:id', { preHandler: requireSelfOrPermission(rbacService, 'users:read') }, controller.getUser);
```
