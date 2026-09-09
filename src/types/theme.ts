export type ThemeMode = 'dark' | 'light' | 'system';

export interface UIPreferences {
  theme: ThemeMode;
  accentColor: string;
  wallpaperId: string;
  soundEnabled: boolean;
  reducedMotion: boolean;
  dockPosition: 'bottom' | 'top';
  desktopIconSize: 'small' | 'medium' | 'large';
}
