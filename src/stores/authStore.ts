/**
 * WebOS Shell - User Session & Authentication Store
 * Manages OS boot state, lock screen, user session, and login authentication.
 */

import { create } from 'zustand';
import { authService, AuthSession } from '../../backend/auth/authService';

export type SystemPowerState = 'booting' | 'login' | 'desktop' | 'locked' | 'sleeping' | 'shutting_down';

interface AuthStoreState {
  powerState: SystemPowerState;
  currentSession: AuthSession | null;
  bootProgress: number;
  availableUsers: Array<{ id: string; username: string; displayName: string; role: string; avatarUrl?: string }>;

  setPowerState: (state: SystemPowerState) => void;
  setBootProgress: (progress: number) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (password: string) => Promise<boolean>;
  restartSystem: () => void;
  shutdownSystem: () => void;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  powerState: 'desktop', // Default directly to desktop, user can lock or logout
  currentSession: {
    token: 'dev-token-initial',
    refreshToken: 'ref-token-initial',
    user: {
      id: 'usr-admin-1',
      username: 'admin',
      email: 'admin@webos.local',
      role: 'admin',
    },
    expiresAt: Date.now() + 86400 * 1000,
  },
  bootProgress: 100,
  availableUsers: [
    { id: 'usr-admin-1', username: 'admin', displayName: 'Administrator', role: 'admin' },
    { id: 'usr-dev-2', username: 'developer', displayName: 'WebOS Developer', role: 'developer' },
    { id: 'usr-guest-3', username: 'guest', displayName: 'Guest User', role: 'guest' },
  ],

  setPowerState: (powerState) => set({ powerState }),
  setBootProgress: (bootProgress) => set({ bootProgress }),

  login: async (username, password) => {
    const session = await authService.login(username, password);
    if (session) {
      set({ currentSession: session, powerState: 'desktop' });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentSession: null, powerState: 'login' });
  },

  lockScreen: () => {
    set({ powerState: 'locked' });
  },

  unlockScreen: async (password) => {
    const { currentSession } = get();
    if (!currentSession) return false;
    const ok = await authService.login(currentSession.user.username, password);
    if (ok) {
      set({ powerState: 'desktop' });
      return true;
    }
    return false;
  },

  restartSystem: () => {
    set({ powerState: 'booting', bootProgress: 0 });
    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      if (p >= 100) {
        clearInterval(interval);
        set({ powerState: 'desktop', bootProgress: 100 });
      } else {
        set({ bootProgress: p });
      }
    }, 150);
  },

  shutdownSystem: () => {
    set({ powerState: 'shutting_down' });
  },
}));
