/**
 * WebOS Backend - RBAC Validation Schemas (Zod)
 */

import { z } from 'zod';

export const CreateRoleRequestSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_]+$/, 'Role name must be uppercase letters, numbers, and underscores')
    .trim(),
  displayName: z.string().min(2).max(100).trim(),
  description: z.string().min(2).max(255).trim(),
  hierarchyLevel: z.number().int().min(0).max(100).default(10),
  permissionIds: z.array(z.string()).optional()
});

export const UpdateRoleRequestSchema = z.object({
  displayName: z.string().min(2).max(100).trim().optional(),
  description: z.string().min(2).max(255).trim().optional(),
  hierarchyLevel: z.number().int().min(0).max(100).optional(),
  permissionIds: z.array(z.string()).optional()
});

export const AssignRoleRequestSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1)
});

export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>;
export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestSchema>;
export type AssignRoleRequest = z.infer<typeof AssignRoleRequestSchema>;
