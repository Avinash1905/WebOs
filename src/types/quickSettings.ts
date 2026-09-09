export interface QuickSettingsState {
  isOpen: boolean;
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  dndEnabled: boolean;
  batterySaverEnabled: boolean;
  volume: number; // 0 to 100
  brightness: number; // 20 to 100
  isMuted: boolean;
  networkName: string;

  openQuickSettings: () => void;
  closeQuickSettings: () => void;
  toggleQuickSettings: () => void;
  setWifiEnabled: (enabled: boolean) => void;
  toggleWifi: () => void;
  setBluetoothEnabled: (enabled: boolean) => void;
  toggleBluetooth: () => void;
  setDndEnabled: (enabled: boolean) => void;
  toggleDnd: () => void;
  setBatterySaverEnabled: (enabled: boolean) => void;
  toggleBatterySaver: () => void;
  setVolume: (val: number) => void;
  setBrightness: (val: number) => void;
  toggleMute: () => void;
}
