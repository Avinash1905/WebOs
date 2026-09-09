import { create } from 'zustand';
import type { QuickSettingsState } from '../types/quickSettings';

const STORAGE_KEY = 'webos_quick_settings';

interface PersistedSettings {
  wifiEnabled?: boolean;
  bluetoothEnabled?: boolean;
  dndEnabled?: boolean;
  batterySaverEnabled?: boolean;
  volume?: number;
  brightness?: number;
  isMuted?: boolean;
}

const loadSettings = (): PersistedSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {};
};

const saveSettings = (state: Partial<QuickSettingsState>) => {
  try {
    const data: PersistedSettings = {
      wifiEnabled: state.wifiEnabled,
      bluetoothEnabled: state.bluetoothEnabled,
      dndEnabled: state.dndEnabled,
      batterySaverEnabled: state.batterySaverEnabled,
      volume: state.volume,
      brightness: state.brightness,
      isMuted: state.isMuted,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const saved = loadSettings();

export const useQuickSettingsStore = create<QuickSettingsState>((set, get) => ({
  isOpen: false,
  wifiEnabled: saved.wifiEnabled ?? true,
  bluetoothEnabled: saved.bluetoothEnabled ?? false,
  dndEnabled: saved.dndEnabled ?? false,
  batterySaverEnabled: saved.batterySaverEnabled ?? false,
  volume: saved.volume ?? 75,
  brightness: saved.brightness ?? 90,
  isMuted: saved.isMuted ?? false,
  networkName: 'WebOS-HighSpeed-5G',

  openQuickSettings: () => set({ isOpen: true }),
  closeQuickSettings: () => set({ isOpen: false }),
  toggleQuickSettings: () => set((state) => ({ isOpen: !state.isOpen })),

  setWifiEnabled: (wifiEnabled) => {
    set({ wifiEnabled });
    saveSettings(get());
  },

  toggleWifi: () => {
    set((state) => {
      const next = !state.wifiEnabled;
      saveSettings({ ...state, wifiEnabled: next });
      return { wifiEnabled: next };
    });
  },

  setBluetoothEnabled: (bluetoothEnabled) => {
    set({ bluetoothEnabled });
    saveSettings(get());
  },

  toggleBluetooth: () => {
    set((state) => {
      const next = !state.bluetoothEnabled;
      saveSettings({ ...state, bluetoothEnabled: next });
      return { bluetoothEnabled: next };
    });
  },

  setDndEnabled: (dndEnabled) => {
    set({ dndEnabled });
    saveSettings(get());
  },

  toggleDnd: () => {
    set((state) => {
      const next = !state.dndEnabled;
      saveSettings({ ...state, dndEnabled: next });
      return { dndEnabled: next };
    });
  },

  setBatterySaverEnabled: (batterySaverEnabled) => {
    set({ batterySaverEnabled });
    saveSettings(get());
  },

  toggleBatterySaver: () => {
    set((state) => {
      const next = !state.batterySaverEnabled;
      saveSettings({ ...state, batterySaverEnabled: next });
      return { batterySaverEnabled: next };
    });
  },

  setVolume: (volume) => {
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    set({ volume: clamped, isMuted: clamped === 0 ? true : get().isMuted });
    saveSettings(get());
  },

  setBrightness: (brightness) => {
    const clamped = Math.max(10, Math.min(100, Math.round(brightness)));
    set({ brightness: clamped });
    // Apply brightness to root document or display filter
    document.documentElement.style.setProperty('--os-screen-brightness', `${clamped / 100}`);
    saveSettings(get());
  },

  toggleMute: () => {
    set((state) => {
      const next = !state.isMuted;
      saveSettings({ ...state, isMuted: next });
      return { isMuted: next };
    });
  },
}));
