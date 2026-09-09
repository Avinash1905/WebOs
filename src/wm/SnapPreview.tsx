import React from 'react';
import { useWindowStore } from '../stores/windowStore';

export const SnapPreview: React.FC = () => {
  const { hoveredSnapZone, activeSnapPreviewBounds } = useWindowStore();

  if (hoveredSnapZone === 'none' || !activeSnapPreviewBounds) {
    return null;
  }

  const { x, y, width, height } = activeSnapPreviewBounds;

  return (
    <div
      className="os-snap-preview"
      data-testid="snap-preview"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div className="os-snap-preview__inner" />
    </div>
  );
};
