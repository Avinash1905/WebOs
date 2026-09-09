/**
 * @file EventSubscription.ts
 * @description Internal subscription records and priority ordering for the WebOS Event Bus.
 */

import type { EventListener, SubscriptionOptions } from './types.js';

let nextRegistrationOrder = 0;

/**
 * Internal record for managing an active listener subscription.
 */
export class SubscriptionRecord<T = unknown> {
  public readonly id: string;
  public readonly eventType?: string;
  public readonly listener: EventListener<T>;
  public readonly priority: number;
  public readonly once: boolean;
  public readonly registrationOrder: number;

  constructor(
    eventType: string | undefined,
    listener: EventListener<T>,
    options?: SubscriptionOptions
  ) {
    this.id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.eventType = eventType;
    this.listener = listener;
    this.priority = options?.priority ?? 0;
    this.once = options?.once ?? false;
    this.registrationOrder = ++nextRegistrationOrder;
  }
}

/**
 * Sorts subscription records by priority descending (higher priority executes first),
 * breaking ties by registration order ascending (FIFO).
 */
export function sortSubscriptions<T>(
  subscriptions: readonly SubscriptionRecord<T>[]
): SubscriptionRecord<T>[] {
  return [...subscriptions].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.registrationOrder - b.registrationOrder;
  });
}
