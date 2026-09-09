import { useTaskbarCustomStore, type TaskbarPosition, type TaskbarAlignment } from '../../stores/taskbarCustomStore';
import { Toggle } from '../../ui/Toggle/Toggle';
import { SegmentedControl } from '../../ui/SegmentedControl/SegmentedControl';

export const TaskbarSettings = () => {
  const {
    position,
    alignment,
    autoHide,
    showBadges,
    showLabels,
    clock24Hour,
    showSeconds,
    setPosition,
    setAlignment,
    toggleAutoHide,
    toggleShowBadges,
    toggleShowLabels,
    toggleClock24Hour,
    toggleShowSeconds,
  } = useTaskbarCustomStore();

  return (
    <div className="os-settings-section">
      <h3 className="os-settings-section-title">Taskbar & System Tray</h3>

      {/* Taskbar Position */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Taskbar Screen Position</span>
          <span className="os-settings-row-sub">Dock the taskbar at the bottom or top of the desktop screen</span>
        </div>
        <SegmentedControl
          value={position}
          onChange={(val) => setPosition(val as TaskbarPosition)}
          options={[
            { id: 'bottom', label: 'Bottom' },
            { id: 'top', label: 'Top' },
          ]}
        />
      </div>

      {/* Taskbar Alignment */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Taskbar Alignment</span>
          <span className="os-settings-row-sub">Center apps like modern OS, or align to the left</span>
        </div>
        <SegmentedControl
          value={alignment}
          onChange={(val) => setAlignment(val as TaskbarAlignment)}
          options={[
            { id: 'center', label: 'Center' },
            { id: 'left', label: 'Left' },
          ]}
        />
      </div>

      {/* Auto Hide */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Automatically Hide the Taskbar</span>
          <span className="os-settings-row-sub">Reveal the taskbar only when the pointer approaches the screen edge</span>
        </div>
        <Toggle
          checked={autoHide}
          onChange={toggleAutoHide}
          aria-label="Automatically Hide Taskbar"
        />
      </div>

      {/* Show App Badges */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Show Notification Badges on Taskbar Apps</span>
          <span className="os-settings-row-sub">Display unread badge counters on taskbar icons</span>
        </div>
        <Toggle
          checked={showBadges}
          onChange={toggleShowBadges}
          aria-label="Show Badges on Taskbar"
        />
      </div>

      {/* Show App Window Titles / Labels */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Show Window Labels on Taskbar Buttons</span>
          <span className="os-settings-row-sub">Display text titles alongside app icons in the running bar</span>
        </div>
        <Toggle
          checked={showLabels}
          onChange={toggleShowLabels}
          aria-label="Show Window Labels"
        />
      </div>

      {/* Clock 24-Hour */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">24-Hour Time Format</span>
          <span className="os-settings-row-sub">Use military / international 24-hour clock (e.g. 14:30 vs 2:30 PM)</span>
        </div>
        <Toggle
          checked={clock24Hour}
          onChange={toggleClock24Hour}
          aria-label="24-Hour Clock"
        />
      </div>

      {/* Show Seconds */}
      <div className="os-settings-row">
        <div className="os-settings-row-label">
          <span className="os-settings-row-title">Show Seconds in Taskbar Clock</span>
          <span className="os-settings-row-sub">Update clock in real-time every second</span>
        </div>
        <Toggle
          checked={showSeconds}
          onChange={toggleShowSeconds}
          aria-label="Show Seconds in Clock"
        />
      </div>
    </div>
  );
};
