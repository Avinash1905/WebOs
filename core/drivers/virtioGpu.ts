/**
 * WebOS VirtIO GPU 2D/3D Display Controller Driver
 */

import { PCIDeviceConfig, PCIDriver } from './pciBus';

export interface DisplayMode {
  width: number;
  height: number;
  refreshRate: number;
  bpp: number;
}

export class VirtIOGpuDriver implements PCIDriver {
  public name = 'VirtIO GPU Driver';
  public vendorId = 0x1af4;
  public deviceId = 0x1050;

  private isAttached = false;
  private currentMode: DisplayMode = {
    width: 1920,
    height: 1080,
    refreshRate: 60,
    bpp: 32,
  };
  private frameCount = 0;
  private vramAllocatedBytes = 0;

  public probe(dev: PCIDeviceConfig): boolean {
    return dev.classCode === 0x03 && dev.vendorId === 0x1af4;
  }

  public async attach(dev: PCIDeviceConfig): Promise<void> {
    this.isAttached = true;
    this.vramAllocatedBytes = 1920 * 1080 * 4 * 2; // Double buffered
  }

  public async detach(dev: PCIDeviceConfig): Promise<void> {
    this.isAttached = false;
  }

  public handleInterrupt(vector: number): void {
    // VSYNC interrupt
    this.frameCount++;
  }

  public setResolution(width: number, height: number, refreshRate = 60): void {
    this.currentMode = { width, height, refreshRate, bpp: 32 };
    this.vramAllocatedBytes = width * height * 4 * 2;
  }

  public getDisplayMode(): DisplayMode {
    return { ...this.currentMode };
  }

  public getStats() {
    return {
      attached: this.isAttached,
      mode: this.currentMode,
      vramBytes: this.vramAllocatedBytes,
      frameCount: this.frameCount,
    };
  }
}

export const virtioGpu = new VirtIOGpuDriver();
