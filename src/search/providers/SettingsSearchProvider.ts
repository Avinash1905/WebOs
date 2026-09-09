import { Sliders, Palette, Volume2, Wifi, Bluetooth, Bell, Moon, Monitor } from 'lucide-react';
import { useQuickSettingsStore } from '../../stores/quickSettingsStore';
import { useWindowStore } from '../../stores/windowStore';
import { useNotificationStore } from '../../stores/notificationStore';
import type { ISearchProvider, SearchResultItem } from '../../types/search';

interface SettingOption {
  id: string;
  title: string;
  subtitle: string;
  keywords: string[];
  icon: typeof Sliders;
  iconColor: string;
  action: () => void;
}

const SETTINGS_OPTIONS: SettingOption[] = [
  {
    id: 'setting-wallpaper',
    title: 'Change Wallpaper',
    subtitle: 'Settings > Personalization > Background',
    keywords: ['wallpaper', 'background', 'theme', 'personalization', 'desktop', 'image'],
    icon: Palette,
    iconColor: '#ec4899',
    action: () => {
      useWindowStore.getState().openWindow({
        id: 'win-settings',
        appId: 'settings',
        title: 'Settings',
        bounds: { width: 800, height: 540 },
      });
    },
  },
  {
    id: 'setting-display',
    title: 'Display & Brightness',
    subtitle: 'Settings > System > Display',
    keywords: ['display', 'brightness', 'monitor', 'resolution', 'scaling', 'screen'],
    icon: Monitor,
    iconColor: '#3b82f6',
    action: () => {
      useQuickSettingsStore.getState().openQuickSettings();
    },
  },
  {
    id: 'setting-sound',
    title: 'Sound & Volume Levels',
    subtitle: 'Settings > System > Audio',
    keywords: ['sound', 'audio', 'volume', 'speaker', 'mute'],
    icon: Volume2,
    iconColor: '#10b981',
    action: () => {
      useQuickSettingsStore.getState().openQuickSettings();
    },
  },
  {
    id: 'setting-wifi',
    title: 'Wi-Fi Network Connections',
    subtitle: 'Settings > Network & Internet > Wi-Fi',
    keywords: ['wifi', 'network', 'internet', 'wireless', 'connection', 'hotspot'],
    icon: Wifi,
    iconColor: '#38bdf8',
    action: () => {
      useQuickSettingsStore.getState().openQuickSettings();
    },
  },
  {
    id: 'setting-bluetooth',
    title: 'Bluetooth Devices',
    subtitle: 'Settings > Devices > Bluetooth',
    keywords: ['bluetooth', 'devices', 'pair', 'wireless', 'mouse', 'keyboard'],
    icon: Bluetooth,
    iconColor: '#6366f1',
    action: () => {
      useQuickSettingsStore.getState().openQuickSettings();
    },
  },
  {
    id: 'setting-notifications',
    title: 'Notification Settings',
    subtitle: 'Settings > System > Notifications',
    keywords: ['notifications', 'alerts', 'dnd', 'do not disturb', 'banners', 'sounds'],
    icon: Bell,
    iconColor: '#f59e0b',
    action: () => {
      useNotificationStore.getState().openNotificationCenter();
    },
  },
  {
    id: 'setting-dark-mode',
    title: 'Toggle Dark Mode',
    subtitle: 'Settings > Personalization > Colors',
    keywords: ['dark', 'mode', 'theme', 'light', 'appearance', 'style'],
    icon: Moon,
    iconColor: '#a855f7',
    action: () => {
      document.documentElement.classList.toggle('dark');
    },
  },
];

export class SettingsSearchProvider implements ISearchProvider {
  id = 'settings-provider';
  name = 'Settings';
  category: 'Settings' = 'Settings';
  priority = 80;

  search(query: string): SearchResultItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: SearchResultItem[] = [];

    for (const opt of SETTINGS_OPTIONS) {
      let score = 0;
      const titleLower = opt.title.toLowerCase();
      if (titleLower === q) {
        score = 90;
      } else if (titleLower.startsWith(q)) {
        score = 70;
      } else if (titleLower.includes(q)) {
        score = 50;
      } else if (opt.keywords.some((k) => k.toLowerCase().includes(q))) {
        score = 45;
      } else if (opt.subtitle.toLowerCase().includes(q)) {
        score = 25;
      }

      if (score > 0) {
        matches.push({
          id: opt.id,
          title: opt.title,
          subtitle: opt.subtitle,
          category: 'Settings',
          icon: opt.icon,
          iconColor: opt.iconColor,
          score,
          keywords: opt.keywords,
          action: opt.action,
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }
}
