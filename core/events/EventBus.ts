/**
 * @file EventBus.ts
 * @description Central System Event Bus implementation for WebOS.
 */

import { BaseSystemService } from '../kernel/Service.js';
import type { Kernel, KernelEventType } from '../kernel/index.js';
import {
  EventEmissionError,
  InvalidEventBusConfigError,
  InvalidEventTypeError,
  InvalidListenerError,
} from './EventError.js';
import { EventHistory } from './EventHistory.js';
import {
  SubscriptionRecord,
  sortSubscriptions,
} from './EventSubscription.js';
import type {
  EventBusConfig,
  EventBusStats,
  EventEmissionOptions,
  EventHistoryFilter,
  EventListener,
  GlobalEventListener,
  SubscriptionOptions,
  SystemEvent,
  SystemEventMap,
  UnsubscribeFunction,
} from './types.js';

let eventIdCounter = 0;

/**
 * The WebOS Central System Event Bus connects all OS modules (Kernel, FileSystem, Storage,
 * ProcessManager, Applications, UI) via strongly-typed publish/subscribe messaging,
 * priority execution, async delivery, bounded history, error isolation, and Kernel lifecycle integration.
 */
export class EventBus extends BaseSystemService {
  public override readonly name = 'event-bus';
  public override readonly dependencies: readonly string[] = [];
  public override readonly optionalDependencies: readonly string[] = [];

  private readonly _config: Required<EventBusConfig>;
  private readonly _history: EventHistory;
  private readonly _subscriptions: Map<string, SubscriptionRecord<any>[]> = new Map();
  private readonly _globalSubscriptions: SubscriptionRecord<unknown>[] = [];
  private readonly _eventCounts: Map<string, number> = new Map();
  private _totalEmitted = 0;
  private _isDispatchingError = false;

  constructor(config?: EventBusConfig) {
    super();

    if (config?.maxHistorySize !== undefined && config.maxHistorySize < 0) {
      throw new InvalidEventBusConfigError(
        'maxHistorySize',
        config.maxHistorySize,
        'maxHistorySize cannot be negative.'
      );
    }

    this._config = {
      historyEnabled: config?.historyEnabled ?? true,
      maxHistorySize: config?.maxHistorySize ?? 500,
      listenerWarningThreshold: config?.listenerWarningThreshold ?? 50,
      captureListenerErrors: config?.captureListenerErrors ?? true,
      defaultSource: config?.defaultSource ?? 'system',
    };

    this._history = new EventHistory(
      this._config.maxHistorySize,
      this._config.historyEnabled
    );
  }

  // =========================================================================
  // Subscription APIs
  // =========================================================================

  /**
   * Subscribes a typed listener to a specific event.
   *
   * @param eventType - The event name.
   * @param listener - Callback invoked when the event is emitted.
   * @param options - Subscription options (priority, once).
   * @returns An unsubscribe function.
   */
  public subscribe<K extends keyof SystemEventMap>(
    eventType: K,
    listener: EventListener<SystemEventMap[K]>,
    options?: SubscriptionOptions
  ): UnsubscribeFunction;
  public subscribe<T = unknown>(
    eventType: string,
    listener: EventListener<T>,
    options?: SubscriptionOptions
  ): UnsubscribeFunction;
  public subscribe(
    eventType: string,
    listener: EventListener<any>,
    options?: SubscriptionOptions
  ): UnsubscribeFunction {
    this.validateEventType(eventType);
    this.validateListener(listener);

    const record = new SubscriptionRecord(eventType, listener, options);

    if (!this._subscriptions.has(eventType)) {
      this._subscriptions.set(eventType, []);
    }

    const list = this._subscriptions.get(eventType)!;
    list.push(record);

    if (list.length > this._config.listenerWarningThreshold) {
      console.warn(
        `[EventBus] Warning: Event '${eventType}' has ${list.length} active listeners, exceeding threshold of ${this._config.listenerWarningThreshold}.`
      );
    }

    return () => {
      this.removeSubscriptionRecord(eventType, record);
    };
  }

  /**
   * Subscribes a one-time listener that automatically unsubscribes after executing once.
   *
   * @param eventType - The event name.
   * @param listener - Callback invoked once.
   * @param options - Optional priority settings.
   * @returns An unsubscribe function.
   */
  public once<K extends keyof SystemEventMap>(
    eventType: K,
    listener: EventListener<SystemEventMap[K]>,
    options?: Omit<SubscriptionOptions, 'once'>
  ): UnsubscribeFunction;
  public once<T = unknown>(
    eventType: string,
    listener: EventListener<T>,
    options?: Omit<SubscriptionOptions, 'once'>
  ): UnsubscribeFunction;
  public once(
    eventType: string,
    listener: EventListener<any>,
    options?: Omit<SubscriptionOptions, 'once'>
  ): UnsubscribeFunction {
    return this.subscribe(eventType, listener, { ...options, once: true });
  }

  /**
   * Explicitly unsubscribes a listener function from a specific event type.
   *
   * @param eventType - The event name.
   * @param listener - The listener function to remove.
   * @returns True if a matching listener was found and removed, false otherwise.
   */
  public unsubscribe<K extends keyof SystemEventMap>(
    eventType: K,
    listener: EventListener<SystemEventMap[K]>
  ): boolean;
  public unsubscribe(eventType: string, listener: EventListener<unknown>): boolean;
  public unsubscribe(eventType: string, listener: EventListener<any>): boolean {
    if (typeof eventType !== 'string' || typeof listener !== 'function') {
      return false;
    }

    const list = this._subscriptions.get(eventType);
    if (!list || list.length === 0) {
      return false;
    }

    const index = list.findIndex((record) => record.listener === listener);
    if (index !== -1) {
      list.splice(index, 1);
      if (list.length === 0) {
        this._subscriptions.delete(eventType);
      }
      return true;
    }

    return false;
  }

  /**
   * Subscribes a global / wildcard listener that receives all dispatched system events.
   *
   * @param listener - Callback invoked for all system events.
   * @param options - Subscription options (priority, once).
   * @returns An unsubscribe function.
   */
  public subscribeAll(
    listener: GlobalEventListener,
    options?: SubscriptionOptions
  ): UnsubscribeFunction {
    this.validateListener(listener);

    const record = new SubscriptionRecord(undefined, listener as EventListener<unknown>, options);
    this._globalSubscriptions.push(record);

    return () => {
      const idx = this._globalSubscriptions.indexOf(record);
      if (idx !== -1) {
        this._globalSubscriptions.splice(idx, 1);
      }
    };
  }

  // =========================================================================
  // Emission APIs
  // =========================================================================

  /**
   * Dispatches an event synchronously to all registered listeners.
   *
   * @param eventType - The event name.
   * @param payload - Strongly-typed payload data.
   * @param options - Optional source, correlationId, processId, userId metadata.
   * @returns The constructed SystemEvent envelope.
   */
  public emit<K extends keyof SystemEventMap>(
    eventType: K,
    payload: SystemEventMap[K],
    options?: EventEmissionOptions
  ): SystemEvent<SystemEventMap[K]>;
  public emit<T = unknown>(
    eventType: string,
    payload: T,
    options?: EventEmissionOptions
  ): SystemEvent<T>;
  public emit(
    eventType: string,
    payload: unknown,
    options?: EventEmissionOptions
  ): SystemEvent<unknown> {
    this.validateEventType(eventType);

    const event = this.createEnvelope(eventType, payload, options);
    this.recordEvent(event);

    const { targeted, global } = this.getSortedSubscribers(eventType);

    // Dispatch to targeted subscribers first, then global subscribers
    for (const record of targeted) {
      this.executeListenerSync(record, event);
    }

    for (const record of global) {
      this.executeGlobalListenerSync(record, event);
    }

    return event;
  }

  /**
   * Dispatches an event asynchronously, awaiting all async listeners while isolating errors.
   *
   * @param eventType - The event name.
   * @param payload - Strongly-typed payload data.
   * @param options - Optional source, correlationId, processId, userId metadata.
   * @returns Promise resolving to the constructed SystemEvent envelope.
   */
  public async emitAsync<K extends keyof SystemEventMap>(
    eventType: K,
    payload: SystemEventMap[K],
    options?: EventEmissionOptions
  ): Promise<SystemEvent<SystemEventMap[K]>>;
  public async emitAsync<T = unknown>(
    eventType: string,
    payload: T,
    options?: EventEmissionOptions
  ): Promise<SystemEvent<T>>;
  public async emitAsync(
    eventType: string,
    payload: unknown,
    options?: EventEmissionOptions
  ): Promise<SystemEvent<unknown>> {
    this.validateEventType(eventType);

    const event = this.createEnvelope(eventType, payload, options);
    this.recordEvent(event);

    const { targeted, global } = this.getSortedSubscribers(eventType);

    // Execute in priority order
    for (const record of targeted) {
      await this.executeListenerAsync(record, event);
    }

    for (const record of global) {
      await this.executeGlobalListenerAsync(record, event);
    }

    return event;
  }

  // =========================================================================
  // History & Query APIs
  // =========================================================================

  /**
   * Returns event history, optionally filtered by criteria.
   */
  public getHistory(filter?: EventHistoryFilter): readonly SystemEvent<unknown>[] {
    if (!filter) {
      return this._history.getAll();
    }
    return this._history.getFiltered(filter);
  }

  /**
   * Returns all stored events of a specific event type.
   */
  public getHistoryByType(type: string): readonly SystemEvent<unknown>[] {
    return this._history.getByType(type);
  }

  /**
   * Clears the event history buffer.
   */
  public clearHistory(): void {
    this._history.clear();
  }

  // =========================================================================
  // Diagnostic & State APIs
  // =========================================================================

  /**
   * Returns runtime statistics for the Event Bus.
   */
  public getStats(): EventBusStats {
    let totalActive = this._globalSubscriptions.length;
    for (const list of this._subscriptions.values()) {
      totalActive += list.length;
    }

    const counts: Record<string, number> = {};
    for (const [type, count] of this._eventCounts.entries()) {
      counts[type] = count;
    }

    return {
      emittedEvents: this._totalEmitted,
      activeListeners: totalActive,
      historySize: this._history.size,
      eventCounts: counts,
    };
  }

  /**
   * Checks whether there are active subscribers for a specific event type or globally.
   *
   * @param eventType - Optional event type. If omitted, checks all events and globals.
   */
  public hasSubscribers(eventType?: string): boolean {
    if (eventType) {
      const list = this._subscriptions.get(eventType);
      return (list !== undefined && list.length > 0) || this._globalSubscriptions.length > 0;
    }
    return this._subscriptions.size > 0 || this._globalSubscriptions.length > 0;
  }

  /**
   * Returns the count of active listeners for an event type or total active listeners.
   *
   * @param eventType - Optional event type.
   */
  public listenerCount(eventType?: string): number {
    if (eventType) {
      const list = this._subscriptions.get(eventType);
      return (list ? list.length : 0) + this._globalSubscriptions.length;
    }

    let count = this._globalSubscriptions.length;
    for (const list of this._subscriptions.values()) {
      count += list.length;
    }
    return count;
  }

  /**
   * Clears all listeners for a specific event type, or all event types if omitted.
   */
  public clear(eventType?: string): void {
    if (eventType) {
      this._subscriptions.delete(eventType);
    } else {
      this._subscriptions.clear();
    }
  }

  /**
   * Clears all subscriptions, including global wildcard listeners.
   */
  public clearAll(): void {
    this._subscriptions.clear();
    this._globalSubscriptions.length = 0;
  }

  // =========================================================================
  // Kernel Lifecycle Integration
  // =========================================================================

  /**
   * Bridges Kernel lifecycle events into the EventBus automatically.
   *
   * @param kernel - The WebOS Kernel instance to bridge.
   * @returns An unsubscribe function to detach from Kernel lifecycle events.
   */
  public attachToKernel(kernel: Kernel): UnsubscribeFunction {
    const lifecycleTypes: KernelEventType[] = [
      'SYSTEM_INITIALIZING',
      'SYSTEM_INITIALIZED',
      'SYSTEM_STARTING',
      'SYSTEM_STARTED',
      'SYSTEM_STOPPING',
      'SYSTEM_STOPPED',
      'SYSTEM_ERROR',
    ];

    const unsubs = lifecycleTypes.map((type) =>
      kernel.addEventListener(type, (event) => {
        if (type === 'SYSTEM_ERROR') {
          this.emit('SYSTEM_ERROR', {
            error: event.error ?? 'Unknown Kernel error',
            source: 'kernel',
            details: event.payload,
          }, { source: 'kernel' });
        } else {
          this.emit(type, {
            status: event.type,
            timestamp: event.timestamp,
          }, { source: 'kernel' });
        }
      })
    );

    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }

  protected override async onInitialize(): Promise<void> {
    // EventBus initialized
  }

  protected override async onStart(): Promise<void> {
    // EventBus started
  }

  protected override async onStop(): Promise<void> {
    // EventBus stopped safely (preserves subscriptions for possible restart)
  }

  protected override async onReset(): Promise<void> {
    this._history.clear();
    this._eventCounts.clear();
    this._totalEmitted = 0;
  }

  // =========================================================================
  // Internal Helpers
  // =========================================================================

  private validateEventType(eventType: unknown): void {
    if (typeof eventType !== 'string' || eventType.trim() === '') {
      throw new InvalidEventTypeError(eventType);
    }
  }

  private validateListener(listener: unknown): void {
    if (typeof listener !== 'function') {
      throw new InvalidListenerError();
    }
  }

  private generateEventId(): string {
    const rand = Math.random().toString(36).slice(2, 9);
    return `evt_${Date.now()}_${++eventIdCounter}_${rand}`;
  }

  private createEnvelope<T>(
    eventType: string,
    payload: T,
    options?: EventEmissionOptions
  ): SystemEvent<T> {
    return {
      id: this.generateEventId(),
      type: eventType,
      timestamp: Date.now(),
      source: options?.source ?? this._config.defaultSource,
      payload,
      correlationId: options?.correlationId,
      userId: options?.userId,
      processId: options?.processId,
      applicationId: options?.applicationId,
    };
  }

  private recordEvent(event: SystemEvent<unknown>): void {
    this._totalEmitted++;
    const current = this._eventCounts.get(event.type) ?? 0;
    this._eventCounts.set(event.type, current + 1);

    if (this._config.historyEnabled) {
      this._history.add(event);
    }
  }

  private getSortedSubscribers(eventType: string): {
    targeted: SubscriptionRecord<any>[];
    global: SubscriptionRecord<unknown>[];
  } {
    const list = this._subscriptions.get(eventType) ?? [];
    return {
      targeted: sortSubscriptions(list),
      global: sortSubscriptions(this._globalSubscriptions),
    };
  }

  private removeSubscriptionRecord(eventType: string, record: SubscriptionRecord<any>): void {
    const list = this._subscriptions.get(eventType);
    if (!list) return;

    const idx = list.indexOf(record);
    if (idx !== -1) {
      list.splice(idx, 1);
      if (list.length === 0) {
        this._subscriptions.delete(eventType);
      }
    }
  }

  private executeListenerSync(
    record: SubscriptionRecord<any>,
    event: SystemEvent<unknown>
  ): void {
    if (record.once && record.eventType) {
      this.removeSubscriptionRecord(record.eventType, record);
    }

    try {
      const result = record.listener(event.payload, event);
      if (result instanceof Promise) {
        result.catch((err) => this.handleListenerError(event.type, err));
      }
    } catch (err) {
      this.handleListenerError(event.type, err);
    }
  }

  private executeGlobalListenerSync(
    record: SubscriptionRecord<unknown>,
    event: SystemEvent<unknown>
  ): void {
    if (record.once) {
      const idx = this._globalSubscriptions.indexOf(record);
      if (idx !== -1) {
        this._globalSubscriptions.splice(idx, 1);
      }
    }

    try {
      const globalListener = record.listener as unknown as GlobalEventListener;
      const result = globalListener(event);
      if (result instanceof Promise) {
        result.catch((err) => this.handleListenerError(event.type, err));
      }
    } catch (err) {
      this.handleListenerError(event.type, err);
    }
  }

  private async executeListenerAsync(
    record: SubscriptionRecord<any>,
    event: SystemEvent<unknown>
  ): Promise<void> {
    if (record.once && record.eventType) {
      this.removeSubscriptionRecord(record.eventType, record);
    }

    try {
      await record.listener(event.payload, event);
    } catch (err) {
      this.handleListenerError(event.type, err);
    }
  }

  private async executeGlobalListenerAsync(
    record: SubscriptionRecord<unknown>,
    event: SystemEvent<unknown>
  ): Promise<void> {
    if (record.once) {
      const idx = this._globalSubscriptions.indexOf(record);
      if (idx !== -1) {
        this._globalSubscriptions.splice(idx, 1);
      }
    }

    try {
      const globalListener = record.listener as unknown as GlobalEventListener;
      await globalListener(event);
    } catch (err) {
      this.handleListenerError(event.type, err);
    }
  }

  private handleListenerError(eventType: string, error: unknown): void {
    if (!this._config.captureListenerErrors) {
      throw new EventEmissionError(eventType, error);
    }

    // Isolate error and safely emit SYSTEM_ERROR once without causing recursion
    if (eventType !== 'SYSTEM_ERROR' && !this._isDispatchingError) {
      this._isDispatchingError = true;
      try {
        this.emit('SYSTEM_ERROR', {
          error: error instanceof Error ? error : new Error(String(error)),
          source: 'event-bus',
          details: { failedEventType: eventType },
        }, { source: 'event-bus' });
      } catch {
        // Fallback: safe no-op if internal error emission fails
      } finally {
        this._isDispatchingError = false;
      }
    }
  }
}
