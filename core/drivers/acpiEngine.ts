/**
 * WebOS ACPI (Advanced Configuration and Power Interface) Engine
 */

export type PowerState = 'S0_Working' | 'S1_Standby' | 'S3_Suspend' | 'S4_Hibernate' | 'S5_Shutdown';

export interface BatteryStatus {
  present: boolean;
  charging: boolean;
  percentage: number;
  voltageMillivolts: number;
  dischargeRateMilliwatts: number;
  estimatedRemainingMinutes: number;
}

export interface ThermalZone {
  name: string;
  temperatureCelsius: number;
  criticalThreshold: number;
  throttlingActive: boolean;
}

export class ACPIEngine {
  private static instance: ACPIEngine;
  private currentState: PowerState = 'S0_Working';
  private battery: BatteryStatus = {
    present: true,
    charging: false,
    percentage: 95,
    voltageMillivolts: 11400,
    dischargeRateMilliwatts: 14200,
    estimatedRemainingMinutes: 240,
  };
  private thermalZones: ThermalZone[] = [
    { name: 'CPU Socket 0', temperatureCelsius: 48.5, criticalThreshold: 95.0, throttlingActive: false },
    { name: 'GPU Core 0', temperatureCelsius: 52.0, criticalThreshold: 90.0, throttlingActive: false },
    { name: 'NVMe Flash Controller', temperatureCelsius: 41.2, criticalThreshold: 80.0, throttlingActive: false },
  ];

  private constructor() {}

  public static getInstance(): ACPIEngine {
    if (!ACPIEngine.instance) {
      ACPIEngine.instance = new ACPIEngine();
    }
    return ACPIEngine.instance;
  }

  public getPowerState(): PowerState {
    return this.currentState;
  }

  public setPowerState(state: PowerState): void {
    this.currentState = state;
  }

  public getBattery(): BatteryStatus {
    return { ...this.battery };
  }

  public getThermalZones(): ThermalZone[] {
    return [...this.thermalZones];
  }

  public simulateThermalTick(): void {
    for (const zone of this.thermalZones) {
      const delta = (Math.random() - 0.5) * 1.5;
      zone.temperatureCelsius = Math.max(30, Math.min(100, zone.temperatureCelsius + delta));
      zone.throttlingActive = zone.temperatureCelsius > (zone.criticalThreshold - 10);
    }
  }
}

export const acpiEngine = ACPIEngine.getInstance();
