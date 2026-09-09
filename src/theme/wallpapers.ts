export type WallpaperType = 'gradient' | 'solid' | 'image';
export type WallpaperFitMode = 'cover' | 'contain' | 'center' | 'tile';

export interface WallpaperConfig {
  id: string;
  name: string;
  type: WallpaperType;
  category: 'Abstract' | 'Cyberpunk' | 'Nature' | 'Minimal' | 'Custom';
  background: string; // CSS background or image url
  fitMode?: WallpaperFitMode;
  previewColor: string;
  blur?: number; // Blur in px (0 to 20)
  brightness?: number; // Brightness percentage (50 to 100)
}

export const WALLPAPERS: WallpaperConfig[] = [
  {
    id: 'cosmic-nebula',
    name: 'Cosmic Nebula',
    type: 'gradient',
    category: 'Abstract',
    background: 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.45) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.45) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.25) 0%, transparent 60%), linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
    previewColor: '#1e1b4b',
  },
  {
    id: 'cyber-aurora',
    name: 'Cyber Aurora',
    type: 'gradient',
    category: 'Cyberpunk',
    background: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.3) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.35) 0%, transparent 50%), linear-gradient(180deg, #05050d 0%, #0b132b 100%)',
    previewColor: '#0b132b',
  },
  {
    id: 'sunset-horizon',
    name: 'Sunset Horizon',
    type: 'gradient',
    category: 'Minimal',
    background: 'radial-gradient(circle at 50% 120%, rgba(244, 63, 94, 0.45) 0%, rgba(249, 115, 22, 0.3) 30%, transparent 70%), linear-gradient(180deg, #0f172a 0%, #1e293b 70%, #0f172a 100%)',
    previewColor: '#1e293b',
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    type: 'gradient',
    category: 'Minimal',
    background: 'radial-gradient(circle at 30% 70%, rgba(99, 102, 241, 0.25) 0%, transparent 50%), linear-gradient(135deg, #020617 0%, #0a0f1d 50%, #020617 100%)',
    previewColor: '#020617',
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    type: 'gradient',
    category: 'Cyberpunk',
    background: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.35) 0%, transparent 45%), linear-gradient(135deg, #022c22 0%, #064e3b 40%, #020617 100%)',
    previewColor: '#064e3b',
  },
  {
    id: 'solid-slate',
    name: 'Midnight Slate (Solid)',
    type: 'solid',
    category: 'Minimal',
    background: '#0f172a',
    previewColor: '#0f172a',
  },
  {
    id: 'solid-pure-black',
    name: 'Pure Black (High Contrast)',
    type: 'solid',
    category: 'Minimal',
    background: '#000000',
    previewColor: '#000000',
  },
];

export const DEFAULT_WALLPAPER = WALLPAPERS[0];
