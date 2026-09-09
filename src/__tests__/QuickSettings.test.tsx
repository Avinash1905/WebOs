import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useQuickSettingsStore } from '../stores/quickSettingsStore';
import { QuickSettingsPanel } from '../shell/quicksettings/QuickSettingsPanel';

describe('Quick Settings Subsystem', () => {
  beforeEach(() => {
    useQuickSettingsStore.setState({
      isOpen: false,
      wifiEnabled: true,
      bluetoothEnabled: false,
      dndEnabled: false,
      batterySaverEnabled: false,
      volume: 75,
      brightness: 85,
      isMuted: false,
    });
  });

  it('toggles wifi, bluetooth, dnd, and battery saver states', () => {
    const store = useQuickSettingsStore.getState();

    store.toggleWifi();
    expect(useQuickSettingsStore.getState().wifiEnabled).toBe(false);

    store.toggleBluetooth();
    expect(useQuickSettingsStore.getState().bluetoothEnabled).toBe(true);

    store.toggleDnd();
    expect(useQuickSettingsStore.getState().dndEnabled).toBe(true);

    store.toggleBatterySaver();
    expect(useQuickSettingsStore.getState().batterySaverEnabled).toBe(true);
  });

  it('updates volume and brightness with clamping', () => {
    const store = useQuickSettingsStore.getState();

    store.setVolume(120);
    expect(useQuickSettingsStore.getState().volume).toBe(100);

    store.setVolume(-10);
    expect(useQuickSettingsStore.getState().volume).toBe(0);
    expect(useQuickSettingsStore.getState().isMuted).toBe(true);

    store.setBrightness(150);
    expect(useQuickSettingsStore.getState().brightness).toBe(100);
  });

  it('renders QuickSettingsPanel and toggles tile when clicked', () => {
    useQuickSettingsStore.getState().openQuickSettings();
    render(<QuickSettingsPanel />);

    expect(screen.getByRole('dialog', { name: /quick settings/i })).toBeInTheDocument();

    const wifiTile = screen.getByText('Wi-Fi').closest('.os-qs-tile');
    expect(wifiTile).toBeInTheDocument();

    fireEvent.click(wifiTile!);
    expect(useQuickSettingsStore.getState().wifiEnabled).toBe(false);
  });
});
