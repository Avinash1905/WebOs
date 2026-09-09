/**
 * WebOS Backend - Notification Push & Dispatch Hub (WebSocket / SSE)
 */

export interface PushNotificationPayload {
  id: string;
  recipientUserId?: string;
  title: string;
  body: string;
  category: 'system' | 'update' | 'security' | 'app' | 'chat';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: number;
  read: boolean;
}

export class NotificationPushService {
  private static instance: NotificationPushService;
  private notificationHistory: PushNotificationPayload[] = [];
  private activeSubscribers: Array<(n: PushNotificationPayload) => void> = [];

  private constructor() {
    this.seedNotifications();
  }

  public static getInstance(): NotificationPushService {
    if (!NotificationPushService.instance) {
      NotificationPushService.instance = new NotificationPushService();
    }
    return NotificationPushService.instance;
  }

  private seedNotifications(): void {
    this.dispatch({
      title: 'WebOS Cloud Sync Active',
      body: 'Automated delta synchronization is connected to backend cluster.',
      category: 'system',
      priority: 'normal',
    });
  }

  public dispatch(params: {
    recipientUserId?: string;
    title: string;
    body: string;
    category?: 'system' | 'update' | 'security' | 'app' | 'chat';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): PushNotificationPayload {
    const payload: PushNotificationPayload = {
      id: `push-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientUserId: params.recipientUserId,
      title: params.title,
      body: params.body,
      category: params.category || 'system',
      priority: params.priority || 'normal',
      timestamp: Date.now(),
      read: false,
    };

    this.notificationHistory.unshift(payload);
    if (this.notificationHistory.length > 500) {
      this.notificationHistory.pop();
    }

    for (const subscriber of this.activeSubscribers) {
      try {
        subscriber(payload);
      } catch (e) {
        console.error('Error dispatching push notification:', e);
      }
    }

    return payload;
  }

  public subscribe(callback: (n: PushNotificationPayload) => void): () => void {
    this.activeSubscribers.push(callback);
    return () => {
      const idx = this.activeSubscribers.indexOf(callback);
      if (idx !== -1) this.activeSubscribers.splice(idx, 1);
    };
  }

  public getHistory(userId?: string): PushNotificationPayload[] {
    if (userId) {
      return this.notificationHistory.filter((n) => !n.recipientUserId || n.recipientUserId === userId);
    }
    return this.notificationHistory;
  }
}

export const notificationPushService = NotificationPushService.getInstance();
