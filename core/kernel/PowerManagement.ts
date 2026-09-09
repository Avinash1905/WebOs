/**
 * @file PowerManagement.ts
 * @description ACPI Power States, WakeLock management, and CPU thermal throttling coordinator.
 */

export type PowerState = 'S0_ACTIVE' | 'S1_STANDBY' | 'S3_SUSPEND' | 'S5_POWER_OFF';

export interface WakeLock {
  readonly id: string;
  readonly tag: string;
  readonly acquiredAt: number;
  readonly pid?: number;
}

export class PowerManagement {
  private currentState: PowerState = 'S0_ACTIVE';
  private readonly wakeLocks = new Map<string, WakeLock>();
  private batteryLevel = 1.0; // 100%
  private isCharging = true;
  private powerSaveMode = false;

  public getState(): PowerState {
    return this.currentState;
  }

  public async transitionTo(targetState: PowerState): Promise<boolean> {
    if (this.wakeLocks.size > 0 && (targetState === 'S3_SUSPEND' || targetState === 'S5_POWER_OFF')) {
      return false; // Active wake locks prevent sleep
    }

    this.currentState = targetState;
    return true;
  }

  public acquireWakeLock(tag: string, pid?: number): WakeLock {
    const id = `wl_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const lock: WakeLock = {
      id,
      tag,
      acquiredAt: Date.now(),
      pid
    };
    this.wakeLocks.set(id, lock);
    return lock;
  }

  public releaseWakeLock(lockId: string): boolean {
    return this.wakeLocks.delete(lockId);
  }

  public updateBattery(level: number, charging: boolean): void {
    this.batteryLevel = Math.max(0, Math.min(1, level));
    this.isCharging = charging;

    if (this.batteryLevel <= 0.15 && !this.isCharging) {
      this.powerSaveMode = true;
    } else if (this.batteryLevel > 0.2) {
      this.powerSaveMode = false;
    }
  }

  public getPowerStatus(): {
    state: PowerState;
    batteryPercent: number;
    isCharging: boolean;
    powerSaveMode: boolean;
    activeWakeLocks: number;
  } {
    return {
      state: this.currentState,
      batteryPercent: Math.round(this.batteryLevel * 100),
      isCharging: this.isCharging,
      powerSaveMode: this.powerSaveMode,
      activeWakeLocks: this.wakeLocks.size
    };
  }
}
