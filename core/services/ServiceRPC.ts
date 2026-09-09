/**
 * @file ServiceRPC.ts
 * @description Typed inter-service Remote Procedure Call (RPC) bridge with timeout.
 */

export type RPCMethodHandler = (params: unknown) => Promise<unknown> | unknown;

export class ServiceRPC {
  private readonly handlers = new Map<string, RPCMethodHandler>();

  public registerMethod(methodName: string, handler: RPCMethodHandler): void {
    this.handlers.set(methodName, handler);
  }

  public async invoke<T = unknown>(methodName: string, params?: unknown, timeoutMs = 5000): Promise<T> {
    const handler = this.handlers.get(methodName);
    if (!handler) {
      throw new Error(`RPC method ${methodName} not found`);
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`RPC invocation ${methodName} timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    const executionPromise = Promise.resolve(handler(params)) as Promise<T>;
    return Promise.race([executionPromise, timeoutPromise]);
  }

  public unregisterMethod(methodName: string): boolean {
    return this.handlers.delete(methodName);
  }
}
