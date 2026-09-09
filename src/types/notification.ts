import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationCategory =
  | 'system'
  | 'application'
  | 'security'
  | 'update'
  | 'message'
  | 'download';

export interface NotificationAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

export interface OSNotification {
  id: string;
  appId?: string;
  appName?: string;
  title: string;
  message: string;
  icon?: LucideIcon | string | ReactNode;
  iconColor?: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  timestamp: number;
  isRead: boolean;
  durationMs?: number; // Auto-dismiss duration in ms (default 5000)
  actions?: NotificationAction[];
  data?: Record<string, unknown>;
}

export interface NotificationStoreState {
  notifications: OSNotification[];
  toasts: OSNotification[];
  isCenterOpen: boolean;
  unreadCount: number;

  addNotification: (notification: Omit<OSNotification, 'id' | 'timestamp' | 'isRead'> & { id?: string }) => string;
  dismissToast: (id: string) => void;
  dismissNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  toggleNotificationCenter: () => void;
  openNotificationCenter: () => void;
  closeNotificationCenter: () => void;
}
