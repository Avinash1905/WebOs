/**
 * WebOS NVMe Solid-State Storage Controller Driver
 */

import { PCIDeviceConfig, PCIDriver } from './pciBus';

export interface NVMeNamespace {
  nsid: number;
  sizeBlocks: number;
  blockSize: number;
  formattedSizeGB: number;
  readOnly: boolean;
}

export interface NVMeCommand {
  opcode: number;
  nsid: number;
  prp1: number;
  prp2: number;
  cdw10: number;
  cdw11: number;
  cdw12: number;
}

export interface NVMeCompletion {
  commandId: number;
  status: number;
  sqId: number;
  sqHead: number;
}

export class NVMeDriver implements PCIDriver {
  public name = 'NVMe Storage Driver';
  public vendorId = 0x1b36;
  public deviceId = 0x0010;

  private isAttached = false;
  private namespaces: NVMeNamespace[] = [];
  private blockStorage: Map<number, Uint8Array> = new Map();
  private submissionQueue: NVMeCommand[] = [];
  private completionQueue: NVMeCompletion[] = [];
  private totalIops = 0;
  private bytesRead = 0;
  private bytesWritten = 0;

  public probe(dev: PCIDeviceConfig): boolean {
    return dev.classCode === 0x01 && dev.subclassCode === 0x08;
  }

  public async attach(dev: PCIDeviceConfig): Promise<void> {
    this.isAttached = true;
    this.namespaces = [
      {
        nsid: 1,
        sizeBlocks: 10485760, // 5GB in 512b blocks
        blockSize: 512,
        formattedSizeGB: 5.0,
        readOnly: false,
      },
      {
        nsid: 2,
        sizeBlocks: 2097152, // 1GB swap/temp
        blockSize: 512,
        formattedSizeGB: 1.0,
        readOnly: false,
      }
    ];
  }

  public async detach(dev: PCIDeviceConfig): Promise<void> {
    this.isAttached = false;
    this.blockStorage.clear();
    this.submissionQueue = [];
    this.completionQueue = [];
  }

  public handleInterrupt(vector: number): void {
    // Process CQ completions
    if (this.submissionQueue.length > 0) {
      const cmd = this.submissionQueue.shift();
      if (cmd) {
        this.completionQueue.push({
          commandId: cmd.opcode,
          status: 0,
          sqId: 1,
          sqHead: 0,
        });
      }
    }
  }

  public async readBlock(nsid: number, lba: number): Promise<Uint8Array> {
    if (!this.isAttached) throw new Error('NVMe controller offline');
    this.totalIops++;
    this.bytesRead += 512;
    const blockKey = (nsid * 100000000) + lba;
    const existing = this.blockStorage.get(blockKey);
    if (existing) return new Uint8Array(existing);
    return new Uint8Array(512);
  }

  public async writeBlock(nsid: number, lba: number, data: Uint8Array): Promise<void> {
    if (!this.isAttached) throw new Error('NVMe controller offline');
    this.totalIops++;
    this.bytesWritten += data.byteLength;
    const blockKey = (nsid * 100000000) + lba;
    const block = new Uint8Array(512);
    block.set(data.subarray(0, 512));
    this.blockStorage.set(blockKey, block);
  }

  public getStats() {
    return {
      attached: this.isAttached,
      namespaceCount: this.namespaces.length,
      totalIops: this.totalIops,
      bytesRead: this.bytesRead,
      bytesWritten: this.bytesWritten,
      storedBlocks: this.blockStorage.size,
    };
  }
}

export const nvmeDriver = new NVMeDriver();
