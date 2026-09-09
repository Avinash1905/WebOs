import { create } from 'zustand';
import type { OSNotification, NotificationStoreState } from '../types/notification';

const DEFAULT_TOAST_DURATION = 5000;
const MAX_TOASTS = 5;
const MAX_HISTORY = 100;

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  notifications: [],
  toasts: [],
  isCenterOpen: false,
  unreadCount: 0,

  addNotification: (params) => {
    const id = params.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const durationMs = params.durationMs !== undefined ? params.durationMs : DEFAULT_TOAST_DURATION;
    
    const notification: OSNotification = {
      ...params,
      id,
      durationMs,
      timestamp: Date.now(),
      isRead: false,
    };

    set((state) => {
      const nextNotifications = [notification, ...state.notifications].slice(0, MAX_HISTORY);
      // If priority is not low, show as active toast
      let nextToasts = state.toasts;
      if (params.priority !== 'low' && durationMs > 0) {
        nextToasts = [notification, ...state.toasts.filter((t) => t.id !== id)].slice(0, MAX_TOASTS);
      }
      return {
        notifications: nextNotifications,
        toasts: nextToasts,
        unreadCount: nextNotifications.filter((n) => !n.isRead).length,
      };
    });

    return id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  dismissNotification: (id) => {
    set((state) => {
      const nextNotifications = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: nextNotifications,
        toasts: state.toasts.filter((t) => t.id !== id),
        unreadCount: nextNotifications.filter((n) => !n.isRead).length,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const nextNotifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications: nextNotifications,
        unreadCount: nextNotifications.filter((n) => !n.isRead).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => {
    set({
      notifications: [],
      toasts: [],
      unreadCount: 0,
    });
  },

  toggleNotificationCenter: () => {
    set((state) => ({ isCenterOpen: !state.isCenterOpen }));
  },

  openNotificationCenter: () => {
    set({ isCenterOpen: true });
  },

  closeNotificationCenter: () => {
    set({ isCenterOpen: false });
  },
}));
