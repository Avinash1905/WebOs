/**
 * @file DeviceDriverRegistry.ts
 * @description Virtual device driver framework supporting character and block devices with IOCTL dispatch.
 */

export type DeviceType = 'CHAR' | 'BLOCK' | 'NET' | 'PSEUDO';

export interface DeviceDescriptor {
  readonly major: number;
  readonly minor: number;
  readonly name: string;
  readonly type: DeviceType;
  readonly blockSize?: number;
  readonly isReadOnly: boolean;
  readonly permissions: number; // 0o660
}

export type DeviceIOCTLHandler = (cmd: number, arg: unknown) => Promise<unknown> | unknown;
export type DeviceReadHandler = (offset: number, length: number) => Promise<Uint8Array> | Uint8Array;
export type DeviceWriteHandler = (offset: number, data: Uint8Array) => Promise<number> | number;

export interface DeviceDriver {
  readonly descriptor: DeviceDescriptor;
  readonly read?: DeviceReadHandler;
  readonly write?: DeviceWriteHandler;
  readonly ioctl?: DeviceIOCTLHandler;
  readonly open?: () => Promise<void> | void;
  readonly close?: () => Promise<void> | void;
}

export class DeviceDriverRegistry {
  private readonly drivers = new Map<string, DeviceDriver>(); // "major:minor" -> Driver
  private readonly nameIndex = new Map<string, string>(); // name -> "major:minor"
    constructor() {
    this.registerStandardDevices();
  }

  public registerDriver(driver: DeviceDriver): void {
    const key = `${driver.descriptor.major}:${driver.descriptor.minor}`;
    if (this.drivers.has(key)) {
      throw new Error(`Device major:minor ${key} is already registered`);
    }
    if (this.nameIndex.has(driver.descriptor.name)) {
      throw new Error(`Device name ${driver.descriptor.name} is already in use`);
    }

    this.drivers.set(key, driver);
    this.nameIndex.set(driver.descriptor.name, key);
  }

  public unregisterDriver(nameOrKey: string): boolean {
    let key = this.nameIndex.get(nameOrKey) ?? nameOrKey;
    const driver = this.drivers.get(key);
    if (!driver) return false;

    this.drivers.delete(key);
    this.nameIndex.delete(driver.descriptor.name);
    return true;
  }

  public getDriverByName(name: string): DeviceDriver | undefined {
    const key = this.nameIndex.get(name);
    return key ? this.drivers.get(key) : undefined;
  }

  public getDriver(major: number, minor: number): DeviceDriver | undefined {
    return this.drivers.get(`${major}:${minor}`);
  }

  public async readDevice(name: string, offset: number, length: number): Promise<Uint8Array> {
    const driver = this.getDriverByName(name);
    if (!driver) throw new Error(`Device /dev/${name} not found`);
    if (!driver.read) throw new Error(`Device /dev/${name} does not support read operations`);
    return driver.read(offset, length);
  }

  public async writeDevice(name: string, offset: number, data: Uint8Array): Promise<number> {
    const driver = this.getDriverByName(name);
    if (!driver) throw new Error(`Device /dev/${name} not found`);
    if (driver.descriptor.isReadOnly) throw new Error(`Device /dev/${name} is read-only`);
    if (!driver.write) throw new Error(`Device /dev/${name} does not support write operations`);
    return driver.write(offset, data);
  }

  public async ioctl(name: string, cmd: number, arg?: unknown): Promise<unknown> {
    const driver = this.getDriverByName(name);
    if (!driver) throw new Error(`Device /dev/${name} not found`);
    if (!driver.ioctl) throw new Error(`Device /dev/${name} does not implement ioctl`);
    return driver.ioctl(cmd, arg);
  }

  public listDevices(): readonly DeviceDescriptor[] {
    return Array.from(this.drivers.values()).map(d => d.descriptor);
  }

  private registerStandardDevices(): void {
    // /dev/null
    this.registerDriver({
      descriptor: { major: 1, minor: 3, name: 'null', type: 'CHAR', isReadOnly: false, permissions: 0o666 },
      read: () => new Uint8Array(0),
      write: (_, data) => data.length
    });

    // /dev/zero
    this.registerDriver({
      descriptor: { major: 1, minor: 5, name: 'zero', type: 'CHAR', isReadOnly: false, permissions: 0o666 },
      read: (_, length) => new Uint8Array(length),
      write: (_, data) => data.length
    });

    // /dev/urandom
    this.registerDriver({
      descriptor: { major: 1, minor: 9, name: 'urandom', type: 'CHAR', isReadOnly: true, permissions: 0o444 },
      read: (_, length) => {
        const buf = new Uint8Array(length);
        for (let i = 0; i < length; i++) buf[i] = Math.floor(Math.random() * 256);
        return buf;
      }
    });
  }
}
