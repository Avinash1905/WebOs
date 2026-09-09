export interface WallpaperConfig {
  id: string;
  name: string;
  category: 'Abstract' | 'Cyberpunk' | 'Nature' | 'Minimal';
  background: string;
  previewColor: string;
}

export const WALLPAPERS: WallpaperConfig[] = [
  {
    id: 'cosmic-nebula',
    name: 'Cosmic Nebula',
    category: 'Abstract',
    background: 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.45) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.45) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.25) 0%, transparent 60%), linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
    previewColor: '#1e1b4b'
  },
  {
    id: 'cyber-aurora',
    name: 'Cyber Aurora',
    category: 'Cyberpunk',
    background: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.3) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.35) 0%, transparent 50%), linear-gradient(180deg, #05050d 0%, #0b132b 100%)',
    previewColor: '#0b132b'
  },
  {
    id: 'sunset-horizon',
    name: 'Sunset Horizon',
    category: 'Minimal',
    background: 'radial-gradient(circle at 50% 120%, rgba(244, 63, 94, 0.45) 0%, rgba(249, 115, 22, 0.3) 30%, transparent 70%), linear-gradient(180deg, #0f172a 0%, #1e293b 70%, #0f172a 100%)',
    previewColor: '#1e293b'
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    category: 'Minimal',
    background: 'radial-gradient(circle at 30% 70%, rgba(99, 102, 241, 0.25) 0%, transparent 50%), linear-gradient(135deg, #020617 0%, #0a0f1d 50%, #020617 100%)',
    previewColor: '#020617'
  }
];

export const DEFAULT_WALLPAPER = WALLPAPERS[0];
