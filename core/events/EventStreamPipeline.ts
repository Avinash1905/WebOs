/**
 * @file EventStreamPipeline.ts
 * @description Reactive stream pipeline operators for OS event transformations.
 */

export type StreamTransform<T, R> = (input: T) => R | Promise<R>;
export type StreamPredicate<T> = (input: T) => boolean;

export class EventStreamPipeline<T> {
  private transforms: Array<(val: unknown) => Promise<unknown> | unknown> = [];

  public map<R>(fn: StreamTransform<T, R>): EventStreamPipeline<R> {
    const next = new EventStreamPipeline<R>();
    next.transforms = [...this.transforms, fn as any];
    return next;
  }

  public filter(predicate: StreamPredicate<T>): EventStreamPipeline<T> {
    const next = new EventStreamPipeline<T>();
    next.transforms = [
      ...this.transforms,
      async (val: any) => {
        const passes = predicate(val);
        if (!passes) return Symbol('FILTERED_OUT');
        return val;
      }
    ];
    return next;
  }

  public async process(data: T): Promise<{ dropped: boolean; result?: unknown }> {
    let current: unknown = data;

    for (const transform of this.transforms) {
      current = await Promise.resolve(transform(current));
      if (typeof current === 'symbol') {
        return { dropped: true };
      }
    }

    return { dropped: false, result: current };
  }
}
