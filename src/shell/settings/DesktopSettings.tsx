import { useDesktopStore } from '../../stores/desktopStore';
import { useThemeStore } from '../../stores/themeStore';
import { Toggle } from '../../ui/Toggle/Toggle';
import { SegmentedControl } from '../../ui/SegmentedControl/SegmentedControl';
import type { UIDensity } from '../../theme/tokens';
import type { DesktopSortMode } from '../../stores/desktopStore';

export const DesktopSettings = () => {
  const autoArrange = useDesktopStore((state) => state.autoArrange);
  const snapToGrid = useDesktopStore((state) => state.snapToGrid);
  const sortMode = useDesktopStore((state) => state.sortMode);
  const toggleAutoArrange = useDesktopStore((state) => state.toggleAutoArrange);
  const setSnapToGrid = useDesktopStore((state) => state.setSnapToGrid);
  const sortIcons = useDesktopStore((state) => state.sortIcons);

  const density = useThemeStore((state) => state.density);
  const setDensity = useThemeStore((state) => state.setDensity);

  return (
    <div className="os-settings-section">
      <h3 className="os-settings-section-title">Desktop & Icons</h3>

      {/* Icon Size / Density */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Desktop Icon Size</span>
          <span className="os-settings-row-sub">Change desktop grid cell spacing and icon graphic sizing</span>
        </div>
        <SegmentedControl
          value={density}
          onChange={(val) => setDensity(val as UIDensity)}
          options={[
            { id: 'compact', label: 'Small' },
            { id: 'comfortable', label: 'Medium' },
            { id: 'spacious', label: 'Large' },
          ]}
        />
      </div>

      {/* Auto Arrange */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Auto Arrange Desktop Icons</span>
          <span className="os-settings-row-sub">Automatically position and order icons into a tidy grid column</span>
        </div>
        <Toggle
          checked={autoArrange}
          onChange={toggleAutoArrange}
          aria-label="Auto Arrange Desktop Icons"
        />
      </div>

      {/* Snap to Grid */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Align Icons to Grid (Snap to Grid)</span>
          <span className="os-settings-row-sub">Snap dragged icons to clean coordinates when dropped</span>
        </div>
        <Toggle
          checked={snapToGrid}
          onChange={() => setSnapToGrid(!snapToGrid)}
          aria-label="Snap to Grid"
        />
      </div>

      {/* Default Sorting */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Default Icon Sorting</span>
          <span className="os-settings-row-sub">Sort icons automatically by name, type, or modified date</span>
        </div>
        <SegmentedControl
          value={sortMode}
          onChange={(val) => sortIcons(val as DesktopSortMode)}
          options={[
            { id: 'name', label: 'Name' },
            { id: 'type', label: 'Type' },
            { id: 'date', label: 'Date' },
          ]}
        />
      </div>
    </div>
  );
};
