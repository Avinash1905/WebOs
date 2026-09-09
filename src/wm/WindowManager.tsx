import React from 'react';
import { useWindowStore } from '../stores/windowStore';
import { WindowContainer } from '../shell/window/WindowContainer';
import { SnapPreview } from './SnapPreview';
import { AltTabSwitcher } from '../keyboard/AltTabSwitcher';
import './wm.css';

export const WindowManager: React.FC = () => {
  const { windows } = useWindowStore();

  return (
    <div className="os-window-manager" data-testid="window-manager">
      {/* Snap Preview Ghost Container */}
      <SnapPreview />

      {/* Render All Open Window Instances in Z-Index Order */}
      {windows.map((win) => (
        <WindowContainer key={win.id} window={win} />
      ))}

      {/* Alt+Tab Task Switcher Overlay */}
      <AltTabSwitcher />
    </div>
  );
};
