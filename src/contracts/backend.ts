/**
 * Member 4 Integration Boundary: Backend & Persistence Services
 * 
 * Member 1 (UI layer) consumes these interfaces to synchronize user settings,
 * notifications, and session state without direct database logic.
 */

import type { UIPreferences } from '../types/theme';

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  email?: string;
  role: 'admin' | 'user' | 'guest';
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  appId?: string;
}

export interface IBackendSyncService {
  getUserProfile(): Promise<UserProfile>;
  loadPreferences(): Promise<Partial<UIPreferences>>;
  savePreferences(prefs: Partial<UIPreferences>): Promise<boolean>;
  getNotifications(): Promise<SystemNotification[]>;
  markNotificationAsRead(id: string): Promise<boolean>;
  clearNotifications(): Promise<boolean>;
}

export class MockBackendAdapter implements IBackendSyncService {
  async getUserProfile(): Promise<UserProfile> {
    return {
      id: 'usr_guest_01',
      username: 'WebOS Explorer',
      role: 'admin'
    };
  }

  async loadPreferences(): Promise<Partial<UIPreferences>> {
    return {};
  }

  async savePreferences(_prefs: Partial<UIPreferences>): Promise<boolean> {
    return true;
  }

  async getNotifications(): Promise<SystemNotification[]> {
    return [
      {
        id: 'notif_01',
        title: 'Welcome to WebOS',
        message: 'Your high-performance browser desktop environment is ready.',
        timestamp: Date.now(),
        type: 'info',
        isRead: false
      }
    ];
  }

  async markNotificationAsRead(_id: string): Promise<boolean> {
    return true;
  }

  async clearNotifications(): Promise<boolean> {
    return true;
  }
}

export const backendService = new MockBackendAdapter();
