import { describe, expect, it } from 'vitest';
import {
  ThermalGovernor,
  NetworkBandwidthMonitor,
  BatteryEnergyEstimator,
  ResourcePressureNotifier,
} from '../../core/resources/index.js';

describe('Resources Deep Subsystems', () => {
  it('ThermalGovernor steps through cooling states and caps CPU frequencies under thermal pressure', () => {
    const tg = new ThermalGovernor();

    expect(tg.setTemperature(45.0)).toBe('NORMAL');
    expect(tg.getCpuFrequencyCapPercentage()).toBe(100);

    expect(tg.setTemperature(70.0)).toBe('WARM');
    expect(tg.getCpuFrequencyCapPercentage()).toBe(85);

    expect(tg.setTemperature(85.0)).toBe('THROTTLED');
    expect(tg.getCpuFrequencyCapPercentage()).toBe(60);

    expect(tg.setTemperature(98.0)).toBe('CRITICAL');
    expect(tg.getCpuFrequencyCapPercentage()).toBe(25);
  });

  it('NetworkBandwidthMonitor enforces rate limits and tracks bandwidth usage', () => {
    const net = new NetworkBandwidthMonitor();

    net.setRateLimit('app_browser', 10000); // 10KB/s limit

    expect(net.recordTraffic('app_browser', 4000, 2000)).toBe(true);
    expect(net.recordTraffic('app_browser', 8000, 5000)).toBe(false); // 13000 > 10000 -> dropped

    const usage = net.getUsage('app_browser');
    expect(usage?.bytesIn).toBe(4000);
    expect(usage?.bytesOut).toBe(2000);
  });

  it('BatteryEnergyEstimator alerts on low power mode and critical battery levels', () => {
    const battery = new BatteryEnergyEstimator();

    battery.updateCharge(80.0, false);
    expect(battery.isLowPowerModeRecommended()).toBe(false);
    expect(battery.isCriticalBattery()).toBe(false);

    battery.updateCharge(15.0, false);
    expect(battery.isLowPowerModeRecommended()).toBe(true);
    expect(battery.isCriticalBattery()).toBe(false);

    battery.updateCharge(4.0, false);
    expect(battery.isCriticalBattery()).toBe(true);

    // When charging, low power mode is suppressed
    battery.updateCharge(4.0, true);
    expect(battery.isCriticalBattery()).toBe(false);
    expect(battery.isLowPowerModeRecommended()).toBe(false);
  });

  it('ResourcePressureNotifier broadcasts PSI metrics updates to subscribers', () => {
    const psi = new ResourcePressureNotifier();
    const records: any[] = [];

    const unsubscribe = psi.onPressure((m) => records.push(m));

    psi.updateMetrics({ cpuSome10: 12.5, memorySome10: 5.0 });
    expect(records.length).toBe(1);
    expect(records[0]!.cpuSome10).toBe(12.5);

    unsubscribe();
    psi.updateMetrics({ cpuSome10: 25.0 });
    expect(records.length).toBe(1);
  });
});
