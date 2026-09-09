/**
 * @file EventHistory.ts
 * @description Bounded in-memory event history buffer and filtering for WebOS.
 */

import { InvalidEventBusConfigError } from './EventError.js';
import type { EventHistoryFilter, SystemEvent } from './types.js';

/**
 * Manages a bounded in-memory buffer of past system events with filtering support.
 */
export class EventHistory {
  private _events: SystemEvent<unknown>[] = [];
  private _maxSize: number;
  private _enabled: boolean;

  constructor(maxSize: number = 500, enabled: boolean = true) {
    if (typeof maxSize !== 'number' || maxSize < 0 || isNaN(maxSize)) {
      throw new InvalidEventBusConfigError(
        'maxHistorySize',
        maxSize,
        'Max history size must be a non-negative number.'
      );
    }
    this._maxSize = Math.floor(maxSize);
    this._enabled = enabled;
  }

  /**
   * Whether history recording is enabled.
   */
  public get isEnabled(): boolean {
    return this._enabled;
  }

  public set isEnabled(value: boolean) {
    this._enabled = value;
  }

  /**
   * Maximum capacity of the event history.
   */
  public get maxSize(): number {
    return this._maxSize;
  }

  /**
   * Updates the maximum capacity of the history buffer.
   */
  public set maxSize(newSize: number) {
    if (typeof newSize !== 'number' || newSize < 0 || isNaN(newSize)) {
      throw new InvalidEventBusConfigError(
        'maxHistorySize',
        newSize,
        'Max history size must be a non-negative number.'
      );
    }
    this._maxSize = Math.floor(newSize);
    if (this._events.length > this._maxSize) {
      this._events = this._events.slice(this._events.length - this._maxSize);
    }
  }

  /**
   * Current number of stored events.
   */
  public get size(): number {
    return this._events.length;
  }

  /**
   * Appends an event to the history buffer. If capacity is exceeded, oldest event is dropped.
   *
   * @param event - The event envelope to store.
   */
  public add(event: SystemEvent<unknown>): void {
    if (!this._enabled || this._maxSize <= 0) {
      return;
    }

    if (this._events.length >= this._maxSize) {
      this._events.shift(); // Evict oldest event (FIFO)
    }

    this._events.push(event);
  }

  /**
   * Returns all stored events in chronological order.
   */
  public getAll(): readonly SystemEvent<unknown>[] {
    return [...this._events];
  }

  /**
   * Returns all stored events matching a specific event type.
   *
   * @param type - The event type name.
   */
  public getByType(type: string): readonly SystemEvent<unknown>[] {
    return this._events.filter((e) => e.type === type);
  }

  /**
   * Returns stored events matching the provided filter criteria.
   *
   * @param filter - Filter parameters.
   */
  public getFiltered(filter: EventHistoryFilter): readonly SystemEvent<unknown>[] {
    let result = this._events;

    if (filter.type) {
      const types = Array.isArray(filter.type) ? new Set(filter.type) : new Set([filter.type]);
      result = result.filter((e) => types.has(e.type));
    }

    if (filter.source) {
      const sources = Array.isArray(filter.source)
        ? new Set(filter.source)
        : new Set([filter.source]);
      result = result.filter((e) => sources.has(e.source));
    }

    if (filter.fromTimestamp !== undefined) {
      result = result.filter((e) => e.timestamp >= filter.fromTimestamp!);
    }

    if (filter.toTimestamp !== undefined) {
      result = result.filter((e) => e.timestamp <= filter.toTimestamp!);
    }

    if (filter.correlationId !== undefined) {
      result = result.filter((e) => e.correlationId === filter.correlationId);
    }

    if (filter.userId !== undefined) {
      result = result.filter((e) => e.userId === filter.userId);
    }

    if (filter.processId !== undefined) {
      result = result.filter((e) => e.processId === filter.processId);
    }

    if (filter.applicationId !== undefined) {
      result = result.filter((e) => e.applicationId === filter.applicationId);
    }

    if (filter.limit !== undefined && filter.limit > 0 && result.length > filter.limit) {
      result = result.slice(result.length - filter.limit);
    }

    return [...result];
  }

  /**
   * Clears all stored events from the history buffer.
   */
  public clear(): void {
    this._events = [];
  }
}
