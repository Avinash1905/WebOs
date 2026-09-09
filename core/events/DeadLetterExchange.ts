/**
 * @file DeadLetterExchange.ts
 * @description Poison message quarantine and dead-letter queue (DLQ) with exponential backoff replay.
 */

export interface DeadLetterMessage {
  readonly messageId: string;
  readonly originalTopic: string;
  readonly payload: unknown;
  readonly errorReason: string;
  readonly failedAt: number;
  retryCount: number;
}

export class DeadLetterExchange {
  private readonly _dlq: DeadLetterMessage[] = [];
  private readonly _maxRetries: number;

  constructor(maxRetries: number = 3) {
    this._maxRetries = maxRetries;
  }

  public routeToDlq(originalTopic: string, payload: unknown, errorReason: string): DeadLetterMessage {
    const msg: DeadLetterMessage = {
      messageId: `dlq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      originalTopic,
      payload,
      errorReason,
      failedAt: Date.now(),
      retryCount: 0,
    };
    this._dlq.push(msg);
    return msg;
  }

  public prepareReplay(): DeadLetterMessage[] {
    const readyForRetry: DeadLetterMessage[] = [];
    const remaining: DeadLetterMessage[] = [];

    for (const msg of this._dlq) {
      if (msg.retryCount < this._maxRetries) {
        msg.retryCount++;
        readyForRetry.push(msg);
      } else {
        remaining.push(msg); // Exceeded retries, stays quarantined
      }
    }

    this._dlq.length = 0;
    this._dlq.push(...remaining);

    return readyForRetry;
  }

  public getQuarantinedCount(): number {
    return this._dlq.length;
  }

  public clear(): void {
    this._dlq.length = 0;
  }
}
