/**
 * WebOS Backend - Authentication Request Validation Schemas (Zod)
 */

import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores')
    .trim(),
  email: z.string().email('Invalid email address').max(255).trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  displayName: z.string().max(100).optional()
});

export const LoginRequestSchema = z.object({
  identifier: z.string().min(3, 'Identifier must be at least 3 characters').max(255).trim(),
  password: z.string().min(1, 'Password is required')
});

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address').max(255).trim().toLowerCase()
});

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(10, 'Invalid token format'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must not exceed 128 characters')
});

export const VerifyEmailRequestSchema = z.object({
  token: z.string().min(10, 'Invalid verification token format')
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;
