import React, { useState } from 'react';
import { Wifi, Volume2, VolumeX, BatteryCharging, Bell } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip/Tooltip';
import { Badge } from '../../ui/Badge/Badge';
import { Clock } from './Clock';
import { useTaskbarStore } from '../../stores/taskbarStore';

export interface SystemTrayProps {
  className?: string;
}

export const SystemTray: React.FC<SystemTrayProps> = ({ className }) => {
  const { activeTrayMenu, setActiveTrayMenu } = useTaskbarStore();
  const [isMuted, setIsMuted] = useState(false);
  const [wifiConnected] = useState(true);
  const [batteryLevel] = useState(94);
  const [unreadNotifications] = useState(1);

  return (
    <div
      className={`os-system-tray ${className || ''}`}
      role="region"
      aria-label="System Tray"
      data-testid="system-tray"
    >
      {/* Network Indicator */}
      <Tooltip content={wifiConnected ? 'Wi-Fi: Connected (High Speed)' : 'Wi-Fi: Disconnected'} position="top">
        <button
          type="button"
          aria-label="Network Status"
          className="os-system-tray__item"
          data-testid="tray-network"
          onClick={() => setActiveTrayMenu(activeTrayMenu === 'network' ? null : 'network')}
        >
          <Wifi size={16} className={wifiConnected ? 'text-emerald-400' : 'text-slate-500'} />
        </button>
      </Tooltip>

      {/* Audio Indicator */}
      <Tooltip content={isMuted ? 'Volume: Muted' : 'Volume: 80%'} position="top">
        <button
          type="button"
          aria-label="Audio Volume"
          className="os-system-tray__item"
          data-testid="tray-volume"
          onClick={() => setIsMuted((prev) => !prev)}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </Tooltip>

      {/* Battery Indicator */}
      <Tooltip content={`Battery: ${batteryLevel}% (Charging)`} position="top">
        <button
          type="button"
          aria-label="Battery Status"
          className="os-system-tray__item"
          data-testid="tray-battery"
        >
          <BatteryCharging size={16} />
        </button>
      </Tooltip>

      {/* Notifications Indicator */}
      <Tooltip content={unreadNotifications > 0 ? `${unreadNotifications} Unread Notification` : 'No Notifications'} position="top">
        <button
          type="button"
          aria-label="Notification Center"
          className="os-system-tray__item os-system-tray__item--notif"
          data-testid="tray-notifications"
          onClick={() => setActiveTrayMenu(activeTrayMenu === 'notifications' ? null : 'notifications')}
        >
          <Bell size={16} />
          {unreadNotifications > 0 && (
            <Badge size="sm" variant="primary" className="os-system-tray__badge">
              {unreadNotifications}
            </Badge>
          )}
        </button>
      </Tooltip>

      <div className="os-system-tray__divider" />

      {/* Clock */}
      <Clock />
    </div>
  );
};
