/**
 * @file EventSourcingAggregate.ts
 * @description Domain Event Sourcing pattern with state replay and aggregate versioning.
 */

export interface DomainEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly version: number;
  readonly timestamp: number;
  readonly payload: Record<string, unknown>;
}

export class EventSourcingAggregate {
  private readonly _aggregateId: string;
  private _version = 0;
  private _state: Record<string, unknown> = {};
  private readonly _changes: DomainEvent[] = [];

  constructor(aggregateId: string) {
    this._aggregateId = aggregateId;
  }

  public applyEvent(eventType: string, payload: Record<string, unknown>): DomainEvent {
    this._version++;
    const event: DomainEvent = {
      eventId: `evt_${Date.now()}_${this._version}`,
      aggregateId: this._aggregateId,
      eventType,
      version: this._version,
      timestamp: Date.now(),
      payload,
    };

    this.mutateState(event);
    this._changes.push(event);
    return event;
  }

  public replay(events: readonly DomainEvent[]): void {
    this._state = {};
    this._version = 0;
    this._changes.length = 0;

    for (const evt of events) {
      if (evt.aggregateId === this._aggregateId) {
        this.mutateState(evt);
        this._version = evt.version;
      }
    }
  }

  private mutateState(event: DomainEvent): void {
    this._state = { ...this._state, ...event.payload };
  }

  public getState(): Record<string, unknown> {
    return { ...this._state };
  }

  public getUncommittedChanges(): readonly DomainEvent[] {
    return [...this._changes];
  }

  public markChangesCommitted(): void {
    this._changes.length = 0;
  }

  public get version(): number {
    return this._version;
  }
}
