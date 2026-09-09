/**
 * @file ThermalGovernor.ts
 * @description Thermal zone governance: temperature tracking, cooling policies and throttling.
 */

export type ThermalZoneState = 'NORMAL' | 'WARM' | 'THROTTLED' | 'CRITICAL';

export class ThermalGovernor {
  private _temperature = 40.0; // Celsius
  private readonly _warmThreshold = 65.0;
  private readonly _throttleThreshold = 80.0;
  private readonly _criticalThreshold = 95.0;

  public setTemperature(tempCelsius: number): ThermalZoneState {
    this._temperature = tempCelsius;
    return this.getState();
  }

  public getState(): ThermalZoneState {
    if (this._temperature >= this._criticalThreshold) return 'CRITICAL';
    if (this._temperature >= this._throttleThreshold) return 'THROTTLED';
    if (this._temperature >= this._warmThreshold) return 'WARM';
    return 'NORMAL';
  }

  public getCpuFrequencyCapPercentage(): number {
    switch (this.getState()) {
      case 'CRITICAL': return 25;
      case 'THROTTLED': return 60;
      case 'WARM': return 85;
      default: return 100;
    }
  }

  public get temperature(): number {
    return this._temperature;
  }
}
