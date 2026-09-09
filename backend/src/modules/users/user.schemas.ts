/**
 * WebOS Backend - User Management Request Schemas (Zod)
 */

import { z } from 'zod';

export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  locale: z.string().min(2).max(10).optional(),
  theme: z.enum(['light', 'dark', 'system', 'matrix', 'cyberpunk', 'nord']).optional(),
  wallpaper: z.string().max(255).optional()
});

export const UpdateDesktopPreferencesRequestSchema = z.object({
  wallpaper: z.string().max(255).optional(),
  theme: z.string().max(50).optional(),
  desktopLayout: z.record(z.unknown()).optional(),
  notificationPreferences: z.record(z.unknown()).optional()
});

export const ChangeUserStatusRequestSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DEACTIVATED', 'LOCKED']),
  reason: z.string().max(255).optional()
});

export const UserQueryRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DEACTIVATED', 'LOCKED']).optional(),
  emailVerified: z.enum(['true', 'false']).transform((v) => v === 'true').optional()
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export type UpdateDesktopPreferencesRequest = z.infer<typeof UpdateDesktopPreferencesRequestSchema>;
export type ChangeUserStatusRequest = z.infer<typeof ChangeUserStatusRequestSchema>;
export type UserQueryRequest = z.infer<typeof UserQueryRequestSchema>;
