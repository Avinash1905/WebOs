import React from 'react';
import { Minus, Square, Copy, Maximize2, Minimize2, X } from 'lucide-react';
import type { WindowInstance } from '../../types/window';

export interface WindowTitleBarProps {
  window: WindowInstance;
  onMinimize: () => void;
  onMaximize: () => void;
  onRestore: () => void;
  onToggleFullscreen?: () => void;
  onClose: () => void;
  onPointerDownDrag?: (e: React.PointerEvent) => void;
}

export const WindowTitleBar: React.FC<WindowTitleBarProps> = ({
  window: win,
  onMinimize,
  onMaximize,
  onRestore,
  onToggleFullscreen,
  onClose,
  onPointerDownDrag,
}) => {
  const isMaximized = win.state === 'maximized' || win.state.startsWith('snapped-');
  const isFullscreen = win.state === 'fullscreen';

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('button')) {
      return;
    }
    if (win.canMaximize !== false) {
      if (isMaximized || isFullscreen) {
        onRestore();
      } else {
        onMaximize();
      }
    }
  };

  const renderIcon = (icon: unknown) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ElementType;
    return <IconComp size={16} />;
  };

  return (
    <div
      className="os-window-titlebar"
      onPointerDown={onPointerDownDrag}
      onDoubleClick={handleDoubleClick}
      data-testid={`window-titlebar-${win.id}`}
    >
      <div className="os-window-titlebar__left">
        {win.icon && (
          <div
            className="os-window-titlebar__icon"
            style={{ color: win.iconColor || 'inherit' }}
          >
            {renderIcon(win.icon)}
          </div>
        )}
        <span className="os-window-titlebar__title">{win.title}</span>
        {win.state.startsWith('snapped-') && (
          <span className="os-window-titlebar__snap-badge">
            {win.state.replace('snapped-', '')}
          </span>
        )}
      </div>

      <div
        className="os-window-titlebar__controls"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {win.canMinimize !== false && (
          <button
            type="button"
            aria-label="Minimize"
            className="os-window-control os-window-control--minimize"
            data-testid="window-minimize-button"
            onClick={onMinimize}
          >
            <Minus size={14} />
          </button>
        )}

        {win.canMaximize !== false && (
          <button
            type="button"
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
            className="os-window-control os-window-control--maximize"
            data-testid="window-maximize-button"
            onClick={isMaximized ? onRestore : onMaximize}
          >
            {isMaximized ? <Copy size={12} /> : <Square size={12} />}
          </button>
        )}

        {onToggleFullscreen && (
          <button
            type="button"
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="os-window-control os-window-control--fullscreen"
            data-testid="window-fullscreen-button"
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}

        {win.canClose !== false && (
          <button
            type="button"
            aria-label="Close"
            className="os-window-control os-window-control--close"
            data-testid="window-close-button"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
