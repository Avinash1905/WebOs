/**
 * WebOS Backend - Repositories Barrel Export
 */

// In-Memory Repositories
export * from './in-memory/in-memory-user.repository.js';
export * from './in-memory/in-memory-user-profile.repository.js';
export * from './in-memory/in-memory-role.repository.js';
export * from './in-memory/in-memory-permission.repository.js';
export * from './in-memory/in-memory-user-role.repository.js';
export * from './in-memory/in-memory-role-permission.repository.js';
export * from './in-memory/in-memory-session.repository.js';
export * from './in-memory/in-memory-session-device.repository.js';
export * from './in-memory/in-memory-auth-attempt.repository.js';
export * from './in-memory/in-memory-password-reset-token.repository.js';
export * from './in-memory/in-memory-email-verification-token.repository.js';
export * from './in-memory/in-memory-security-event.repository.js';
export * from './in-memory/in-memory-login-history.repository.js';
export * from './in-memory/in-memory-database.js';

// Prisma Repositories
export * from './prisma/prisma-user.repository.js';
export * from './prisma/prisma-user-profile.repository.js';
export * from './prisma/prisma-role.repository.js';
export * from './prisma/prisma-permission.repository.js';
export * from './prisma/prisma-user-role.repository.js';
export * from './prisma/prisma-role-permission.repository.js';
export * from './prisma/prisma-session.repository.js';
export * from './prisma/prisma-session-device.repository.js';
export * from './prisma/prisma-auth-attempt.repository.js';
export * from './prisma/prisma-password-reset-token.repository.js';
export * from './prisma/prisma-email-verification-token.repository.js';
export * from './prisma/prisma-security-event.repository.js';
export * from './prisma/prisma-login-history.repository.js';
export * from './prisma/prisma-database.js';
