/**
 * WebOS Backend - Module 4: User Management & Profiles Types
 */

import type { UserStatus, UserProfileEntity } from '../database/database.types.js';

export interface UpdateUserProfileDto {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  locale?: string;
  theme?: string;
  wallpaper?: string;
}

export interface UpdateDesktopPreferencesDto {
  wallpaper?: string;
  theme?: string;
  desktopLayout?: Record<string, unknown>;
  notificationPreferences?: Record<string, unknown>;
}

export interface UserStatusChangeDto {
  status: UserStatus;
  reason?: string;
}

export interface UserDetailDto {
  id: string;
  username: string;
  email: string;
  status: UserStatus;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lastLoginAt: Date | null;
  lastPasswordChangeAt: Date;
  createdAt: Date;
  updatedAt: Date;
  profile: UserProfileEntity | null;
  roles: readonly string[];
}
