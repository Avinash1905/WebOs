import { useNotificationStore } from '../stores/notificationStore';
import type { OSNotification } from '../types/notification';

export const useNotifications = () => {
  const store = useNotificationStore();

  const notify = (
    title: string,
    message: string,
    options?: Partial<Omit<OSNotification, 'id' | 'title' | 'message' | 'timestamp' | 'isRead'>>
  ) => {
    return store.addNotification({
      title,
      message,
      priority: options?.priority || 'normal',
      category: options?.category || 'system',
      ...options,
    });
  };

  const notifySuccess = (title: string, message: string) => {
    return notify(title, message, { category: 'system', priority: 'normal' });
  };

  const notifyWarning = (title: string, message: string) => {
    return notify(title, message, { category: 'system', priority: 'high' });
  };

  const notifyError = (title: string, message: string) => {
    return notify(title, message, { category: 'security', priority: 'urgent', durationMs: 8000 });
  };

  return {
    ...store,
    notify,
    notifySuccess,
    notifyWarning,
    notifyError,
  };
};
