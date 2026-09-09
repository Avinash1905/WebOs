import { useThemeStore } from '../../stores/themeStore';
import { WALLPAPERS, type WallpaperFitMode } from '../../theme/wallpapers';
import { SegmentedControl } from '../../ui/SegmentedControl/SegmentedControl';
import { Slider } from '../../ui/Slider/Slider';

export const WallpaperPicker = () => {
  const wallpaper = useThemeStore((state) => state.wallpaper);
  const wallpaperFit = useThemeStore((state) => state.wallpaperFit);
  const wallpaperBlur = useThemeStore((state) => state.wallpaperBlur);
  const setWallpaper = useThemeStore((state) => state.setWallpaper);
  const setWallpaperFit = useThemeStore((state) => state.setWallpaperFit);
  const setWallpaperBlur = useThemeStore((state) => state.setWallpaperBlur);

  return (
    <div className="os-settings-section">
      <h3 className="os-settings-section-title">Wallpaper & Background</h3>

      {/* Wallpapers Grid */}
      <div className="os-wallpaper-grid">
        {WALLPAPERS.map((wp) => (
          <div
            key={wp.id}
            className={`os-wallpaper-card ${wallpaper.id === wp.id ? 'active' : ''}`}
            style={{
              background: wp.background,
              backgroundSize: 'cover',
            }}
            onClick={() => setWallpaper(wp.id)}
            role="button"
            tabIndex={0}
            aria-label={`Select wallpaper ${wp.name}`}
          >
            <span className="os-wallpaper-card-name">{wp.name}</span>
          </div>
        ))}
      </div>

      {/* Wallpaper Fit Mode */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Wallpaper Fit Mode</span>
          <span className="os-settings-row-sub">Choose how wallpaper fills the viewport</span>
        </div>
        <SegmentedControl
          value={wallpaperFit}
          onChange={(val) => setWallpaperFit(val as WallpaperFitMode)}
          options={[
            { id: 'cover', label: 'Cover' },
            { id: 'contain', label: 'Fit' },
            { id: 'tile', label: 'Tile' },
          ]}
        />
      </div>

      {/* Wallpaper Blur */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Background Blur Filter ({wallpaperBlur}px)</span>
          <span className="os-settings-row-sub">Add soft aesthetic blur to improve desktop icon contrast</span>
        </div>
        <div style={{ width: 140 }}>
          <Slider
            min={0}
            max={20}
            step={1}
            value={wallpaperBlur}
            onChange={setWallpaperBlur}
            aria-label="Wallpaper Blur Intensity"
          />
        </div>
      </div>
    </div>
  );
};
