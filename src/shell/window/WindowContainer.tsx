import React, { useRef } from 'react';
import clsx from 'clsx';
import type { WindowInstance } from '../../types/window';
import { WindowTitleBar } from './WindowTitleBar';
import { WindowContent } from './WindowContent';
import { WindowResizeHandles } from '../../wm/WindowResizeHandles';
import { useWindowDrag } from '../../wm/useWindowDrag';
import { useWindowResize } from '../../wm/useWindowResize';
import { useWindowStore } from '../../stores/windowStore';
import './window.css';

export interface WindowContainerProps {
  window: WindowInstance;
  children?: React.ReactNode;
}

export const WindowContainer: React.FC<WindowContainerProps> = ({
  window: initialWindow,
  children,
}) => {
  const {
    windows,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    toggleFullscreen,
    closeWindow,
  } = useWindowStore();

  const win = windows.find((w) => w.id === initialWindow.id) || initialWindow;
  const containerRef = useRef<HTMLDivElement>(null);

  const { handlePointerDown: handleDragPointerDown } = useWindowDrag({
    window: win,
    disabled: win.state === 'fullscreen',
  });

  const { handleResizeStart } = useWindowResize({
    window: win,
    disabled: win.state !== 'normal',
  });

  if (win.state === 'minimized') {
    return null;
  }

  const isMaximized = win.state === 'maximized';
  const isFullscreen = win.state === 'fullscreen';
  const isSnapped = win.state.startsWith('snapped-');

  let windowStyle: React.CSSProperties;

  if (isFullscreen) {
    windowStyle = {
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: win.zIndex + 1000,
      borderRadius: 0,
    };
  } else if (isMaximized) {
    windowStyle = {
      top: 0,
      left: 0,
      width: '100%',
      height: `calc(100% - var(--os-taskbar-height))`,
      zIndex: win.zIndex,
      borderRadius: 0,
    };
  } else if (isSnapped) {
    windowStyle = {
      top: `${win.bounds.y}px`,
      left: `${win.bounds.x}px`,
      width: `${win.bounds.width}px`,
      height: `${win.bounds.height}px`,
      zIndex: win.zIndex,
      borderRadius: 'var(--os-radius-sm)',
    };
  } else {
    windowStyle = {
      top: `${win.bounds.y}px`,
      left: `${win.bounds.x}px`,
      width: `${win.bounds.width}px`,
      height: `${win.bounds.height}px`,
      zIndex: win.zIndex,
    };
  }

  const handleContainerMouseDown = () => {
    if (!win.isFocused) {
      focusWindow(win.id);
    }
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={win.title}
      aria-modal="false"
      data-testid={`window-${win.id}`}
      className={clsx(
        'os-window',
        win.isFocused && 'os-window--focused',
        isMaximized && 'os-window--maximized',
        isFullscreen && 'os-window--fullscreen',
        isSnapped && 'os-window--snapped'
      )}
      style={windowStyle}
      onMouseDown={handleContainerMouseDown}
    >
      <WindowTitleBar
        window={win}
        onMinimize={() => minimizeWindow(win.id)}
        onMaximize={() => maximizeWindow(win.id)}
        onRestore={() => restoreWindow(win.id)}
        onToggleFullscreen={() => toggleFullscreen(win.id)}
        onClose={() => closeWindow(win.id)}
        onPointerDownDrag={handleDragPointerDown}
      />

      <WindowContent>
        {children || win.content || (
          <div className="os-window__default-content">
            <div className="os-window__placeholder-card">
              <h3>{win.title}</h3>
              <p>Application sandbox ready for Member 3 integration.</p>
              <div className="os-window__app-badge">App ID: {win.appId}</div>
            </div>
          </div>
        )}
      </WindowContent>

      <WindowResizeHandles
        onResizeStart={handleResizeStart}
        disabled={win.state !== 'normal' || win.canResize === false}
      />
    </div>
  );
};
