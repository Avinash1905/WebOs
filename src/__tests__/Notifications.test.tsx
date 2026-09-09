import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useNotificationStore } from '../stores/notificationStore';
import { NotificationToastContainer } from '../notifications/NotificationToastContainer';
import { NotificationCenter } from '../shell/notifications/NotificationCenter';

describe('Notification Subsystem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useNotificationStore.setState({
      notifications: [],
      toasts: [],
      isCenterOpen: false,
      unreadCount: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds notification, increments unread count, and enqueues toast', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        title: 'Build Complete',
        message: 'WebOS build succeeded in 1.4s',
        priority: 'normal',
        category: 'system',
        durationMs: 4000,
      });
    });

    const state = useNotificationStore.getState();
    expect(state.notifications.length).toBe(1);
    expect(state.toasts.length).toBe(1);
    expect(state.unreadCount).toBe(1);
    expect(state.notifications[0].title).toBe('Build Complete');
  });

  it('renders NotificationToastContainer and handles dismiss button', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        title: 'New Message',
        message: 'You have received an encrypted message',
        priority: 'high',
        category: 'message',
        durationMs: 5000,
      });
    });

    render(<NotificationToastContainer />);

    expect(screen.getByText('New Message')).toBeInTheDocument();
    expect(screen.getByText('You have received an encrypted message')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close notification/i });
    fireEvent.click(closeBtn);

    expect(useNotificationStore.getState().toasts.length).toBe(0);
    // Preserved in history
    expect(useNotificationStore.getState().notifications.length).toBe(1);
  });

  it('auto-dismisses toast after duration expires', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        title: 'Auto Dismiss Test',
        message: 'This will disappear in 3s',
        priority: 'normal',
        category: 'system',
        durationMs: 3000,
      });
    });

    render(<NotificationToastContainer />);
    expect(screen.getByText('Auto Dismiss Test')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3100);
    });

    expect(useNotificationStore.getState().toasts.length).toBe(0);
  });

  it('renders NotificationCenter with notifications, mark read, and clear all', () => {
    act(() => {
      useNotificationStore.getState().addNotification({
        title: 'Notif 1',
        message: 'Message 1',
        priority: 'normal',
        category: 'system',
      });
      useNotificationStore.getState().addNotification({
        title: 'Notif 2',
        message: 'Message 2',
        priority: 'urgent',
        category: 'security',
      });
      useNotificationStore.getState().openNotificationCenter();
    });

    render(<NotificationCenter />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Notif 1')).toBeInTheDocument();
    expect(screen.getByText('Notif 2')).toBeInTheDocument();
    expect(useNotificationStore.getState().unreadCount).toBe(2);

    // Read all
    const readAllBtn = screen.getByRole('button', { name: /read all/i });
    fireEvent.click(readAllBtn);
    expect(useNotificationStore.getState().unreadCount).toBe(0);

    // Clear all
    const clearBtn = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearBtn);
    expect(useNotificationStore.getState().notifications.length).toBe(0);
  });
});
