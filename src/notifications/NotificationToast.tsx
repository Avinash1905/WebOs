import { useEffect, useRef } from 'react';
import { X, Bell } from 'lucide-react';
import type { OSNotification } from '../types/notification';
import { renderOSIcon } from '../utils/iconUtils';

interface NotificationToastProps {
  notification: OSNotification;
  onDismiss: (id: string) => void;
}

export const NotificationToast = ({ notification, onDismiss }: NotificationToastProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notification.durationMs && notification.durationMs > 0) {
      timerRef.current = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.durationMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification.id, notification.durationMs, onDismiss]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    if (notification.durationMs && notification.durationMs > 0) {
      timerRef.current = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.durationMs);
    }
  };

  return (
    <div
      className={`os-notification-toast priority-${notification.priority}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
    >
      <div className="os-toast-header">
        <div className="os-toast-app-info">
          {notification.appName || notification.category}
        </div>
        <button
          className="os-toast-close-btn"
          onClick={() => onDismiss(notification.id)}
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>

      <div className="os-toast-body">
        <div className="os-toast-icon-wrap">
          {notification.icon ? (
            renderOSIcon(notification.icon, { size: 18, color: notification.iconColor })
          ) : (
            <Bell size={18} />
          )}
        </div>
        <div className="os-toast-content">
          <div className="os-toast-title">{notification.title}</div>
          <div className="os-toast-message">{notification.message}</div>
          {notification.actions && notification.actions.length > 0 && (
            <div className="os-toast-actions">
              {notification.actions.map((act) => (
                <button
                  key={act.id}
                  className={`os-toast-action-btn ${act.variant || 'secondary'}`}
                  onClick={() => {
                    act.onClick();
                    onDismiss(notification.id);
                  }}
                >
                  {act.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
