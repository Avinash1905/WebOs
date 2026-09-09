import React, { useState } from 'react';
import { Wifi, WifiOff, Volume2, VolumeX, BatteryCharging, Bell } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip/Tooltip';
import { Badge } from '../../ui/Badge/Badge';
import { Clock } from './Clock';
import { CalendarPopover } from './CalendarPopover';
import { useQuickSettingsStore } from '../../stores/quickSettingsStore';
import { useNotificationStore } from '../../stores/notificationStore';

export interface SystemTrayProps {
  className?: string;
}

export const SystemTray: React.FC<SystemTrayProps> = ({ className }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Quick Settings Store
  const wifiEnabled = useQuickSettingsStore((state) => state.wifiEnabled);
  const volume = useQuickSettingsStore((state) => state.volume);
  const isMuted = useQuickSettingsStore((state) => state.isMuted);
  const toggleQuickSettings = useQuickSettingsStore((state) => state.toggleQuickSettings);

  // Notification Store
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const toggleNotificationCenter = useNotificationStore((state) => state.toggleNotificationCenter);

  return (
    <div
      className={`os-system-tray ${className || ''}`}
      role="region"
      aria-label="System Tray"
      data-testid="system-tray"
    >
      {/* Network Indicator */}
      <Tooltip content={wifiEnabled ? 'Wi-Fi: Connected' : 'Wi-Fi: Disconnected'} position="top">
        <button
          type="button"
          aria-label="Network Status"
          className="os-system-tray__item"
          data-testid="tray-network"
          data-tray-button="quicksettings"
          onClick={toggleQuickSettings}
        >
          {wifiEnabled ? (
            <Wifi size={16} className="text-emerald-400" />
          ) : (
            <WifiOff size={16} className="text-slate-500" />
          )}
        </button>
      </Tooltip>

      {/* Audio Indicator */}
      <Tooltip content={isMuted ? 'Volume: Muted' : `Volume: ${volume}%`} position="top">
        <button
          type="button"
          aria-label="Audio Volume"
          className="os-system-tray__item"
          data-testid="tray-volume"
          data-tray-button="quicksettings"
          onClick={toggleQuickSettings}
        >
          {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </Tooltip>

      {/* Battery Indicator */}
      <Tooltip content="Battery: 96% (Plugged in)" position="top">
        <button
          type="button"
          aria-label="Battery Status"
          className="os-system-tray__item"
          data-testid="tray-battery"
          data-tray-button="quicksettings"
          onClick={toggleQuickSettings}
        >
          <BatteryCharging size={16} />
        </button>
      </Tooltip>

      {/* Notifications Indicator */}
      <Tooltip
        content={unreadCount > 0 ? `${unreadCount} Unread Notifications` : 'No New Notifications'}
        position="top"
      >
        <button
          type="button"
          aria-label="Notification Center"
          className="os-system-tray__item os-system-tray__item--notif"
          data-testid="tray-notifications"
          data-tray-button="notifications"
          onClick={toggleNotificationCenter}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <Badge size="sm" variant="primary" className="os-system-tray__badge">
              {unreadCount}
            </Badge>
          )}
        </button>
      </Tooltip>

      <div className="os-system-tray__divider" />

      {/* Clock & Interactive Calendar */}
      <Clock onClick={() => setIsCalendarOpen((prev) => !prev)} />
      <CalendarPopover isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
    </div>
  );
};
