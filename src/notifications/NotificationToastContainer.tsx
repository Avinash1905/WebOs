import { useNotificationStore } from '../stores/notificationStore';
import { NotificationToast } from './NotificationToast';
import './notifications.css';

export const NotificationToastContainer = () => {
  const toasts = useNotificationStore((state) => state.toasts);
  const dismissToast = useNotificationStore((state) => state.dismissToast);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="os-toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          notification={toast}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
};
