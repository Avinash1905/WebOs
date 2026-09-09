/**
 * @file ACPIPowerEngine.ts
 * @description Advanced Configuration and Power Interface (ACPI) state machine and power tables.
 */

export type ACPIGlobalState = 'G0_WORKING' | 'G1_SLEEP' | 'G2_SOFT_OFF' | 'G3_MECHANICAL_OFF';
export type ACPIDeviceState = 'D0_FULLY_ON' | 'D1_LOW_POWER' | 'D2_STANDBY' | 'D3_POWER_OFF';

export interface ACPITableHeader {
  readonly signature: string; // e.g. DSDT, FADT, SSDT, MADT
  readonly length: number;
  readonly revision: number;
  readonly oemId: string;
}

export class ACPIPowerEngine {
  private _globalState: ACPIGlobalState = 'G0_WORKING';
  private readonly _deviceStates = new Map<string, ACPIDeviceState>();
  private readonly _tables = new Map<string, ACPITableHeader>();

  constructor() {
    this.registerTable('FADT', { signature: 'FADT', length: 244, revision: 6, oemId: 'WEBOS_ACPI' });
    this.registerTable('DSDT', { signature: 'DSDT', length: 1024, revision: 2, oemId: 'WEBOS_ACPI' });
    this.registerTable('MADT', { signature: 'MADT', length: 120, revision: 5, oemId: 'WEBOS_ACPI' });
  }

  public transitionGlobalState(target: ACPIGlobalState): boolean {
    this._globalState = target;
    if (target === 'G2_SOFT_OFF' || target === 'G3_MECHANICAL_OFF') {
      for (const dev of this._deviceStates.keys()) {
        this._deviceStates.set(dev, 'D3_POWER_OFF');
      }
    }
    return true;
  }

  public setDevicePower(deviceId: string, state: ACPIDeviceState): void {
    this._deviceStates.set(deviceId, state);
  }

  public getDevicePower(deviceId: string): ACPIDeviceState {
    return this._deviceStates.get(deviceId) ?? 'D0_FULLY_ON';
  }

  public registerTable(sig: string, header: ACPITableHeader): void {
    this._tables.set(sig, header);
  }

  public getTable(sig: string): ACPITableHeader | undefined {
    return this._tables.get(sig);
  }

  public get globalState(): ACPIGlobalState {
    return this._globalState;
  }
}
