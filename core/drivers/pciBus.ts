/**
 * WebOS PCI Bus & Hardware Controller Subsystem
 */

export interface PCIDeviceConfig {
  bus: number;
  device: number;
  function: number;
  vendorId: number;
  deviceId: number;
  classCode: number;
  subclassCode: number;
  progIf: number;
  revisionId: number;
  bars: number[];
  interruptLine: number;
  interruptPin: number;
  deviceName: string;
}

export interface PCIDriver {
  name: string;
  vendorId: number;
  deviceId: number;
  probe(dev: PCIDeviceConfig): boolean;
  attach(dev: PCIDeviceConfig): Promise<void>;
  detach(dev: PCIDeviceConfig): Promise<void>;
  handleInterrupt(vector: number): void;
}

export class PCIBusManager {
  private static instance: PCIBusManager;
  private devices: Map<string, PCIDeviceConfig> = new Map();
  private drivers: Map<string, PCIDriver> = new Map();
  private attachedDrivers: Map<string, PCIDriver> = new Map();

  private constructor() {
    this.scanBus();
  }

  public static getInstance(): PCIBusManager {
    if (!PCIBusManager.instance) {
      PCIBusManager.instance = new PCIBusManager();
    }
    return PCIBusManager.instance;
  }

  public registerDriver(driver: PCIDriver): void {
    this.drivers.set(driver.name, driver);
    this.matchDrivers();
  }

  public getDevices(): PCIDeviceConfig[] {
    return Array.from(this.devices.values());
  }

  public getDevice(id: string): PCIDeviceConfig | undefined {
    return this.devices.get(id);
  }

  private scanBus(): void {
    // Standard virtualized PCI root complex devices
    const simulatedDevices: PCIDeviceConfig[] = [
      {
        bus: 0,
        device: 0,
        function: 0,
        vendorId: 0x8086,
        deviceId: 0x1237,
        classCode: 0x06,
        subclassCode: 0x00,
        progIf: 0x00,
        revisionId: 0x02,
        bars: [0x00000000],
        interruptLine: 0,
        interruptPin: 0,
        deviceName: 'Intel 82440FX PCI Host Bridge',
      },
      {
        bus: 0,
        device: 1,
        function: 0,
        vendorId: 0x8086,
        deviceId: 0x7000,
        classCode: 0x06,
        subclassCode: 0x01,
        progIf: 0x00,
        revisionId: 0x00,
        bars: [0x00000000],
        interruptLine: 0,
        interruptPin: 0,
        deviceName: 'Intel 82371SB PIIX3 ISA Bridge',
      },
      {
        bus: 0,
        device: 2,
        function: 0,
        vendorId: 0x1af4,
        deviceId: 0x1050,
        classCode: 0x03,
        subclassCode: 0x00,
        progIf: 0x00,
        revisionId: 0x01,
        bars: [0xe0000000, 0xe1000000],
        interruptLine: 11,
        interruptPin: 1,
        deviceName: 'Red Hat VirtIO GPU Accelerator',
      },
      {
        bus: 0,
        device: 3,
        function: 0,
        vendorId: 0x8086,
        deviceId: 0x100e,
        classCode: 0x02,
        subclassCode: 0x00,
        progIf: 0x00,
        revisionId: 0x03,
        bars: [0xf0000000, 0x0000c000],
        interruptLine: 10,
        interruptPin: 1,
        deviceName: 'Intel 82540EM Gigabit Ethernet NIC',
      },
      {
        bus: 0,
        device: 4,
        function: 0,
        vendorId: 0x1b36,
        deviceId: 0x0010,
        classCode: 0x01,
        subclassCode: 0x08,
        progIf: 0x02,
        revisionId: 0x02,
        bars: [0xf2000000, 0xf2010000],
        interruptLine: 12,
        interruptPin: 1,
        deviceName: 'QEMU NVMe Controller (PCIe Gen4 x4)',
      },
      {
        bus: 0,
        device: 5,
        function: 0,
        vendorId: 0x1b36,
        deviceId: 0x000d,
        classCode: 0x0c,
        subclassCode: 0x03,
        progIf: 0x30,
        revisionId: 0x01,
        bars: [0xf3000000],
        interruptLine: 14,
        interruptPin: 1,
        deviceName: 'QEMU xHCI USB 3.0 Host Controller',
      },
      {
        bus: 0,
        device: 6,
        function: 0,
        vendorId: 0x8086,
        deviceId: 0x2415,
        classCode: 0x04,
        subclassCode: 0x01,
        progIf: 0x00,
        revisionId: 0x01,
        bars: [0x0000e000, 0x0000e100],
        interruptLine: 9,
        interruptPin: 1,
        deviceName: 'Intel 82801AA AC\'97 Audio Controller',
      }
    ];

    for (const dev of simulatedDevices) {
      const devKey = `${dev.bus}:${dev.device}.${dev.function}`;
      this.devices.set(devKey, dev);
    }
  }

  private matchDrivers(): void {
    for (const [key, dev] of this.devices.entries()) {
      if (this.attachedDrivers.has(key)) continue;
      for (const driver of this.drivers.values()) {
        if (driver.probe(dev)) {
          this.attachedDrivers.set(key, driver);
          driver.attach(dev).catch((err) => console.error(`Failed to attach driver ${driver.name} to ${key}:`, err));
          break;
        }
      }
    }
  }
}

export const pciBus = PCIBusManager.getInstance();
