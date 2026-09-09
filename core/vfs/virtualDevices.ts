/**
 * WebOS Core - Virtual Device Drivers & Special Character Devices (/dev)
 * Implements Unix-style virtual stream devices: /dev/null, /dev/zero, /dev/random, /dev/clipboard.
 */

import { VFSBuffer } from './buffer';

export interface DeviceDriver {
  read(length: number, offset?: number): Uint8Array;
  write(data: Uint8Array, offset?: number): number;
}

export class VirtualDeviceManager {
  private static instance: VirtualDeviceManager;
  private drivers: Map<string, DeviceDriver> = new Map();
  private clipboardContent: string = '';

  private constructor() {
    this.registerBuiltinDevices();
  }

  public static getInstance(): VirtualDeviceManager {
    if (!VirtualDeviceManager.instance) {
      VirtualDeviceManager.instance = new VirtualDeviceManager();
    }
    return VirtualDeviceManager.instance;
  }

  private registerBuiltinDevices() {
    // /dev/null
    this.drivers.set('/dev/null', {
      read: () => new Uint8Array(0),
      write: (data) => data.length,
    });

    // /dev/zero
    this.drivers.set('/dev/zero', {
      read: (length) => new Uint8Array(length),
      write: (data) => data.length,
    });

    // /dev/random & /dev/urandom
    const randomDriver: DeviceDriver = {
      read: (length) => {
        const bytes = new Uint8Array(length);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          crypto.getRandomValues(bytes);
        } else {
          for (let i = 0; i < length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
          }
        }
        return bytes;
      },
      write: (data) => data.length,
    };
    this.drivers.set('/dev/random', randomDriver);
    this.drivers.set('/dev/urandom', randomDriver);

    // /dev/clipboard
    this.drivers.set('/dev/clipboard', {
      read: () => {
        return VFSBuffer.fromString(this.clipboardContent).toBytes();
      },
      write: (data) => {
        this.clipboardContent = VFSBuffer.fromBytes(data).toString();
        return data.length;
      },
    });
  }

  public registerDevice(path: string, driver: DeviceDriver) {
    this.drivers.set(path, driver);
  }

  public isDevice(path: string): boolean {
    return this.drivers.has(path);
  }

  public getDevice(path: string): DeviceDriver | undefined {
    return this.drivers.get(path);
  }
}

export const deviceManager = VirtualDeviceManager.getInstance();
