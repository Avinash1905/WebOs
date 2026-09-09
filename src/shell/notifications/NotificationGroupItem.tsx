import { Bell, X } from 'lucide-react';
import type { OSNotification } from '../../types/notification';
import { renderOSIcon } from '../../utils/iconUtils';

interface NotificationGroupItemProps {
  notification: OSNotification;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export const NotificationGroupItem = ({
  notification,
  onDismiss,
  onMarkRead,
}: NotificationGroupItemProps) => {
  return (
    <div
      className={`os-notif-group-item ${!notification.isRead ? 'unread' : ''}`}
      onClick={() => onMarkRead(notification.id)}
    >
      <button
        className="os-notif-item-dismiss"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        title="Dismiss notification"
      >
        <X size={12} />
      </button>

      <div className="os-notif-item-top">
        <span className="os-notif-item-app">
          {notification.appName || notification.category}
        </span>
        <span className="os-notif-item-time">
          {formatRelativeTime(notification.timestamp)}
        </span>
      </div>

      <div className="os-notif-item-main">
        <div className="os-notif-item-icon">
          {notification.icon ? (
            renderOSIcon(notification.icon, { size: 16, color: notification.iconColor })
          ) : (
            <Bell size={16} />
          )}
        </div>
        <div className="os-notif-item-text">
          <div className="os-notif-item-title">{notification.title}</div>
          <div className="os-notif-item-desc">{notification.message}</div>
        </div>
      </div>
    </div>
  );
};
