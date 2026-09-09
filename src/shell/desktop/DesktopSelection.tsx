import React from 'react';
import type { SelectionBox } from '../../stores/desktopStore';

interface DesktopSelectionProps {
  box: SelectionBox | null;
}

export const DesktopSelection: React.FC<DesktopSelectionProps> = ({ box }) => {
  if (!box) return null;

  const left = Math.min(box.startX, box.currentX);
  const top = Math.min(box.startY, box.currentY);
  const width = Math.abs(box.currentX - box.startX);
  const height = Math.abs(box.currentY - box.startY);

  if (width < 3 && height < 3) return null;

  return (
    <div
      className="os-desktop-lasso-box"
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: '1px solid rgba(59, 130, 246, 0.8)',
        backgroundColor: 'rgba(59, 130, 246, 0.18)',
        borderRadius: '2px',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
};
