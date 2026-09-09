/**
 * WebOS USB 3.0 xHCI Host Controller & HID Protocol Stack
 */

export interface USBDeviceDescriptor {
  id: string;
  vendorId: number;
  productId: number;
  deviceClass: number;
  subClass: number;
  protocol: number;
  manufacturer: string;
  productName: string;
  serialNumber: string;
  speed: 'Low' | 'Full' | 'High' | 'SuperSpeed';
}

export interface HIDEvent {
  type: 'keydown' | 'keyup' | 'mousemove' | 'mousedown' | 'mouseup' | 'wheel' | 'gamepad';
  code?: string;
  key?: string;
  x?: number;
  y?: number;
  button?: number;
  deltaY?: number;
  gamepadIndex?: number;
  timestamp: number;
}

export class USBStack {
  private static instance: USBStack;
  private connectedDevices: Map<string, USBDeviceDescriptor> = new Map();
  private eventListeners: Array<(event: HIDEvent) => void> = [];

  private constructor() {
    this.initDefaultDevices();
  }

  public static getInstance(): USBStack {
    if (!USBStack.instance) {
      USBStack.instance = new USBStack();
    }
    return USBStack.instance;
  }

  private initDefaultDevices(): void {
    const defaultKeyboard: USBDeviceDescriptor = {
      id: 'usb-kbd-0',
      vendorId: 0x046d,
      productId: 0xc31c,
      deviceClass: 0x03, // HID
      subClass: 0x01,    // Boot Interface
      protocol: 0x01,    // Keyboard
      manufacturer: 'Logitech',
      productName: 'USB Optical Gaming Keyboard',
      serialNumber: 'KBD-994182',
      speed: 'High',
    };

    const defaultMouse: USBDeviceDescriptor = {
      id: 'usb-mouse-0',
      vendorId: 0x046d,
      productId: 0xc077,
      deviceClass: 0x03, // HID
      subClass: 0x01,    // Boot Interface
      protocol: 0x02,    // Mouse
      manufacturer: 'Logitech',
      productName: 'USB Precision Optical Mouse',
      serialNumber: 'MOU-102948',
      speed: 'High',
    };

    this.connectedDevices.set(defaultKeyboard.id, defaultKeyboard);
    this.connectedDevices.set(defaultMouse.id, defaultMouse);
  }

  public getDevices(): USBDeviceDescriptor[] {
    return Array.from(this.connectedDevices.values());
  }

  public attachDevice(dev: USBDeviceDescriptor): void {
    this.connectedDevices.set(dev.id, dev);
  }

  public detachDevice(id: string): boolean {
    return this.connectedDevices.delete(id);
  }

  public subscribeHID(callback: (event: HIDEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter((cb) => cb !== callback);
    };
  }

  public dispatchHIDEvent(event: HIDEvent): void {
    for (const cb of this.eventListeners) {
      cb(event);
    }
  }
}

export const usbStack = USBStack.getInstance();
