/**
 * @file BatteryEnergyEstimator.ts
 * @description Battery state-of-charge estimator and power drain profiler.
 */

export class BatteryEnergyEstimator {
  private _chargePercentage = 100.0;
  private _isCharging = false;

  public updateCharge(percentage: number, isCharging: boolean = false): void {
    this._chargePercentage = Math.max(0, Math.min(100, percentage));
    this._isCharging = isCharging;
  }

  public isLowPowerModeRecommended(): boolean {
    return !this._isCharging && this._chargePercentage <= 20.0;
  }

  public isCriticalBattery(): boolean {
    return !this._isCharging && this._chargePercentage <= 5.0;
  }

  public get charge(): number {
    return this._chargePercentage;
  }

  public get isCharging(): boolean {
    return this._isCharging;
  }
}
