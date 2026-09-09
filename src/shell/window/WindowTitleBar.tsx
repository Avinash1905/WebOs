import React from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import type { WindowInstance } from '../../types/window';

export interface WindowTitleBarProps {
  window: WindowInstance;
  onMinimize: () => void;
  onMaximize: () => void;
  onRestore: () => void;
  onClose: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export const WindowTitleBar: React.FC<WindowTitleBarProps> = ({
  window: win,
  onMinimize,
  onMaximize,
  onRestore,
  onClose,
  onMouseDown,
}) => {
  const isMaximized = win.state === 'maximized';

  const handleDoubleClick = () => {
    if (win.canMaximize !== false) {
      if (isMaximized) {
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
      onMouseDown={onMouseDown}
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
      </div>

      <div className="os-window-titlebar__controls" onMouseDown={(e) => e.stopPropagation()}>
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
