/**
 * WebOS Core - Virtual Network Interfaces (lo, eth0, wlan0)
 */

import { NetworkInterfaceConfig } from './types';

export class VirtualNetworkInterface {
  public config: NetworkInterfaceConfig;
  private packetListeners: Array<(packet: Uint8Array) => void> = [];

  constructor(config: NetworkInterfaceConfig) {
    this.config = { ...config };
  }

  public sendPacket(packet: Uint8Array): void {
    if (!this.config.isUp) return;
    this.config.txBytes += packet.length;
    this.config.txPackets++;

    for (const listener of this.packetListeners) {
      try {
        listener(packet);
      } catch (e) {
        console.error(`Network packet listener error on [${this.config.name}]:`, e);
      }
    }
  }

  public receivePacket(packet: Uint8Array): void {
    if (!this.config.isUp) return;
    this.config.rxBytes += packet.length;
    this.config.rxPackets++;
  }

  public onPacket(listener: (packet: Uint8Array) => void): () => void {
    this.packetListeners.push(listener);
    return () => {
      const idx = this.packetListeners.indexOf(listener);
      if (idx !== -1) this.packetListeners.splice(idx, 1);
    };
  }

  public setUp(isUp: boolean): void {
    this.config.isUp = isUp;
  }
}

export class NetworkDeviceManager {
  private static instance: NetworkDeviceManager;
  private interfaces: Map<string, VirtualNetworkInterface> = new Map();

  private constructor() {
    this.initializeDefaultDevices();
  }

  public static getInstance(): NetworkDeviceManager {
    if (!NetworkDeviceManager.instance) {
      NetworkDeviceManager.instance = new NetworkDeviceManager();
    }
    return NetworkDeviceManager.instance;
  }

  private initializeDefaultDevices(): void {
    // Loopback device
    this.addInterface(new VirtualNetworkInterface({
      name: 'lo',
      macAddress: '00:00:00:00:00:00',
      ipAddress: '127.0.0.1',
      subnetMask: '255.0.0.0',
      gateway: '0.0.0.0',
      dnsServers: ['127.0.0.1'],
      isUp: true,
      rxBytes: 1024,
      txBytes: 1024,
      rxPackets: 16,
      txPackets: 16,
    }));

    // Primary Ethernet device
    this.addInterface(new VirtualNetworkInterface({
      name: 'eth0',
      macAddress: '52:54:00:12:34:56',
      ipAddress: '192.168.1.150',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      dnsServers: ['1.1.1.1', '8.8.8.8'],
      isUp: true,
      rxBytes: 204850,
      txBytes: 102400,
      rxPackets: 1420,
      txPackets: 980,
    }));
  }

  public addInterface(iface: VirtualNetworkInterface): void {
    this.interfaces.set(iface.config.name, iface);
  }

  public getInterface(name: string): VirtualNetworkInterface | undefined {
    return this.interfaces.get(name);
  }

  public getAllInterfaces(): VirtualNetworkInterface[] {
    return Array.from(this.interfaces.values());
  }
}

export const networkDevices = NetworkDeviceManager.getInstance();
