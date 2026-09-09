import React from 'react';
import type { ResizeDirection } from '../types/window';

export interface WindowResizeHandlesProps {
  onResizeStart: (direction: ResizeDirection, e: React.PointerEvent) => void;
  disabled?: boolean;
}

const DIRECTIONS: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export const WindowResizeHandles: React.FC<WindowResizeHandlesProps> = ({
  onResizeStart,
  disabled = false,
}) => {
  if (disabled) return null;

  return (
    <div className="os-window-resize-handles" aria-hidden="true">
      {DIRECTIONS.map((dir) => (
        <div
          key={dir}
          className={`os-window-resize-handle os-window-resize-handle--${dir}`}
          data-direction={dir}
          onPointerDown={(e) => onResizeStart(dir, e)}
        />
      ))}
    </div>
  );
};
