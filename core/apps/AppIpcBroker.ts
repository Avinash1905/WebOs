/**
 * @file AppIpcBroker.ts
 * @description DBus-style inter-application remote procedure call and signal broker.
 */

export type IpcMethodHandler = (params: unknown) => Promise<unknown> | unknown;

export class AppIpcBroker {
  private readonly _methods = new Map<string, IpcMethodHandler>(); // app.interface.method -> handler

  public registerMethod(interfaceName: string, methodName: string, handler: IpcMethodHandler): void {
    this._methods.set(`${interfaceName}.${methodName}`, handler);
  }

  public async callMethod(interfaceName: string, methodName: string, params: unknown): Promise<unknown> {
    const handler = this._methods.get(`${interfaceName}.${methodName}`);
    if (!handler) {
      throw new Error(`Method not found: ${interfaceName}.${methodName}`);
    }
    return handler(params);
  }
}
