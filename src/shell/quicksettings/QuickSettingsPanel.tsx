import { useEffect, useRef } from 'react';
import { Wifi, Bluetooth, Moon, BatteryCharging, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import { useQuickSettingsStore } from '../../stores/quickSettingsStore';
import { useWindowStore } from '../../stores/windowStore';
import { useOverlayStore } from '../../stores/overlayStore';
import { QuickSettingsTile } from './QuickSettingsTile';
import { QuickSettingsSliders } from './QuickSettingsSliders';
import './quicksettings.css';

export const QuickSettingsPanel = () => {
  const isOpen = useQuickSettingsStore((state) => state.isOpen);
  const closeQuickSettings = useQuickSettingsStore((state) => state.closeQuickSettings);

  const wifiEnabled = useQuickSettingsStore((state) => state.wifiEnabled);
  const toggleWifi = useQuickSettingsStore((state) => state.toggleWifi);
  const networkName = useQuickSettingsStore((state) => state.networkName);

  const bluetoothEnabled = useQuickSettingsStore((state) => state.bluetoothEnabled);
  const toggleBluetooth = useQuickSettingsStore((state) => state.toggleBluetooth);

  const dndEnabled = useQuickSettingsStore((state) => state.dndEnabled);
  const toggleDnd = useQuickSettingsStore((state) => state.toggleDnd);

  const batterySaverEnabled = useQuickSettingsStore((state) => state.batterySaverEnabled);
  const toggleBatterySaver = useQuickSettingsStore((state) => state.toggleBatterySaver);

  const registerOverlay = useOverlayStore((state) => state.registerOverlay);
  const panelRef = useRef<HTMLDivElement>(null);

  // Overlay registration
  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerOverlay({
      id: 'quick-settings',
      type: 'quick-settings',
      priority: 40,
      onDismiss: closeQuickSettings,
    });
    return unregister;
  }, [isOpen, registerOverlay, closeQuickSettings]);

  // Outside click listener
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-tray-button="quicksettings"]')) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        closeQuickSettings();
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, closeQuickSettings]);

  if (!isOpen) return null;

  const handleOpenSettings = () => {
    closeQuickSettings();
    useWindowStore.getState().openWindow({
      id: 'win-settings',
      appId: 'settings',
      title: 'Settings',
      bounds: { width: 800, height: 540 },
    });
  };

  return (
    <>
      <div className="os-quicksettings-overlay" onClick={closeQuickSettings} />
      <div
        ref={panelRef}
        className="os-quicksettings-panel"
        role="dialog"
        aria-label="Quick Settings"
      >
        <div className="os-qs-tiles-grid">
          <QuickSettingsTile
            icon={Wifi}
            title="Wi-Fi"
            statusText={wifiEnabled ? networkName : 'Off'}
            isActive={wifiEnabled}
            onClick={toggleWifi}
          />
          <QuickSettingsTile
            icon={Bluetooth}
            title="Bluetooth"
            statusText={bluetoothEnabled ? 'Discoverable' : 'Off'}
            isActive={bluetoothEnabled}
            onClick={toggleBluetooth}
          />
          <QuickSettingsTile
            icon={Moon}
            title="Focus / DND"
            statusText={dndEnabled ? 'Active' : 'Off'}
            isActive={dndEnabled}
            onClick={toggleDnd}
          />
          <QuickSettingsTile
            icon={BatteryCharging}
            title="Battery Saver"
            statusText={batterySaverEnabled ? 'On (Eco)' : 'Balanced'}
            isActive={batterySaverEnabled}
            onClick={toggleBatterySaver}
          />
        </div>

        <QuickSettingsSliders />

        <div className="os-qs-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>WebOS Secure Shield: Active</span>
          </div>
          <button
            className="os-qs-footer-btn"
            onClick={handleOpenSettings}
            title="Open All Settings"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </div>
    </>
  );
};
