import React, { useState } from 'react';
import { Palette, Image, Keyboard, Layout, Monitor, Accessibility } from 'lucide-react';
import { ThemeEditor } from './ThemeEditor';
import { WallpaperPicker } from './WallpaperPicker';
import { ShortcutEditor } from './ShortcutEditor';
import { DesktopSettings } from './DesktopSettings';
import { TaskbarSettings } from './TaskbarSettings';
import { A11ySettings } from './A11ySettings';
import { DefaultAppsSettings } from './DefaultAppsSettings';
import './settings.css';

type SettingsTab = 'theme' | 'wallpaper' | 'shortcuts' | 'desktop' | 'taskbar' | 'a11y' | 'default-apps';

interface NavItem {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'theme', label: 'Appearance', icon: Palette },
  { id: 'wallpaper', label: 'Wallpaper', icon: Image },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'desktop', label: 'Desktop & Icons', icon: Layout },
  { id: 'taskbar', label: 'Taskbar & Clock', icon: Monitor },
  { id: 'default-apps', label: 'Default Apps', icon: Layout },
  { id: 'a11y', label: 'Accessibility', icon: Accessibility },
];

export interface SettingsAppProps {
  windowId?: string;
  appId?: string;
}

export const SettingsApp: React.FC<SettingsAppProps> = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme');

  return (
    <div className="os-settings-app" data-testid="settings-app">
      {/* Sidebar Navigation */}
      <nav className="os-settings-sidebar" aria-label="Settings Categories">
        {NAV_ITEMS.map((item) => {
          const IconComp = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`os-settings-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <IconComp size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Settings Body */}
      <main className="os-settings-content">
        {activeTab === 'theme' && <ThemeEditor />}
        {activeTab === 'wallpaper' && <WallpaperPicker />}
        {activeTab === 'shortcuts' && <ShortcutEditor />}
        {activeTab === 'desktop' && <DesktopSettings />}
        {activeTab === 'taskbar' && <TaskbarSettings />}
        {activeTab === 'default-apps' && <DefaultAppsSettings />}
        {activeTab === 'a11y' && <A11ySettings />}
      </main>
    </div>
  );
};
