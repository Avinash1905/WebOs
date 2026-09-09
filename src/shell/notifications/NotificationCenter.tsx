import { useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { useOverlayStore } from '../../stores/overlayStore';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import { NotificationGroupItem } from './NotificationGroupItem';
import './notificationCenter.css';

export const NotificationCenter = () => {
  const isOpen = useNotificationStore((state) => state.isCenterOpen);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const closeCenter = useNotificationStore((state) => state.closeNotificationCenter);
  const dismissNotification = useNotificationStore((state) => state.dismissNotification);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const clearAll = useNotificationStore((state) => state.clearAll);

  const registerOverlay = useOverlayStore((state) => state.registerOverlay);
  const panelRef = useRef<HTMLDivElement>(null);

  // Register in overlay stack when open
  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerOverlay({
      id: 'notification-center',
      type: 'notification-center',
      priority: 30, // Higher than start menu, lower than search
      onDismiss: closeCenter,
    });
    return unregister;
  }, [isOpen, registerOverlay, closeCenter]);

  // Handle outside clicks
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking notification toggle button in taskbar
      if (target.closest('[data-tray-button="notifications"]')) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        closeCenter();
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, closeCenter]);

  if (!isOpen) return null;

  return (
    <>
      <div className="os-notification-center-overlay" onClick={closeCenter} />
      <div
        ref={panelRef}
        className="os-notification-center"
        role="dialog"
        aria-label="Notification Center"
      >
        <div className="os-notif-center-header">
          <div className="os-notif-center-title">
            <Bell size={18} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="os-notif-center-badge">{unreadCount}</span>
            )}
          </div>
          <div className="os-notif-center-actions">
            {notifications.length > 0 && (
              <>
                {unreadCount > 0 && (
                  <button
                    className="os-notif-center-btn"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} style={{ marginRight: 4 }} />
                    Read All
                  </button>
                )}
                <button
                  className="os-notif-center-btn clear"
                  onClick={clearAll}
                  title="Clear all notifications"
                >
                  <Trash2 size={14} style={{ marginRight: 4 }} />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        <div className="os-notif-center-list">
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell size={36} />}
              title="No Notifications"
              description="You're completely caught up! New alerts and messages will appear here."
            />
          ) : (
            notifications.map((notif) => (
              <NotificationGroupItem
                key={notif.id}
                notification={notif}
                onDismiss={dismissNotification}
                onMarkRead={markAsRead}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};
