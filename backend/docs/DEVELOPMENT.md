# WebOS Developer Onboarding & Contribution Guide
**Local Environment Setup, Extension Patterns & Quality Gates**

---

## 1. Prerequisites

* **Node.js**: `v20.0.0` or higher (tested on Node.js v24.20.0).
* **npm**: `v10.0.0` or higher.
* **Database (Optional for local development)**: PostgreSQL 14+ (in-memory mode is default for tests and mock development).

---

## 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Key environment variables:
```env
NODE_ENV=development
HOST=127.0.0.1
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgresql://webos:webos_password@localhost:5432/webos_db?schema=public
SESSION_SECRET=your-32-character-secret-key-here-1234
CORS_ORIGIN=*
```

---

## 3. Database Workflow (PostgreSQL & Prisma)

When working with a live PostgreSQL instance:

```bash
# Push schema changes directly to local database
npx prisma db push

# Generate migration SQL
npx prisma migrate dev --name <migration_name>

# Apply pending production migrations
npx prisma migrate deploy

# Open Prisma Studio web inspector
npx prisma studio
```

---

## 4. Quality Verification Gates

Before submitting any commit or pull request, all four verification gates must pass:

```bash
# 1. Typecheck: Verify strict TypeScript typing with zero errors
npm run typecheck

# 2. Linter: Verify ESLint rules and code hygiene
npm run lint

# 3. Test Suite: Run all 20 test suites across 155 tests
npm test

# 4. Production Build: Compile TypeScript to dist/
npm run build
```

---

## 5. Adding New Domain Modules

When extending the WebOS backend:
1. **Define Schema**: Add models and relations to `prisma/schema.prisma`.
2. **Define Entity Interfaces**: Add entity contracts to `src/modules/database/database.types.ts`.
3. **Implement Dual Repositories**: Create both `InMemory*` and `Prisma*` implementations.
4. **Register in Container**: Wire repositories and services in `src/modules/phase1.container.ts`.
5. **Mount Routes**: Register Fastify routes in `src/server/routes.ts`.
6. **Add Unit & Integration Tests**: Include both domain service tests and HTTP integration tests under `tests/modules/`.
