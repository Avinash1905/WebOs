import type { WindowBounds, SnapZone } from '../types/window';

export const TASKBAR_HEIGHT = 48;
export const DEFAULT_MIN_WIDTH = 320;
export const DEFAULT_MIN_HEIGHT = 200;
export const SNAP_THRESHOLD = 20;

export interface ViewportDimensions {
  width: number;
  height: number;
  availableHeight: number;
}

export const getViewportDimensions = (): ViewportDimensions => {
  if (typeof window === 'undefined') {
    return { width: 1920, height: 1080, availableHeight: 1080 - TASKBAR_HEIGHT };
  }
  const width = window.innerWidth || document.documentElement.clientWidth || 1920;
  const height = window.innerHeight || document.documentElement.clientHeight || 1080;
  return {
    width,
    height,
    availableHeight: Math.max(200, height - TASKBAR_HEIGHT),
  };
};

export const calculateSnapBounds = (
  zone: SnapZone,
  viewport: ViewportDimensions = getViewportDimensions()
): WindowBounds => {
  const { width, availableHeight } = viewport;
  const halfWidth = Math.floor(width / 2);
  const halfHeight = Math.floor(availableHeight / 2);

  switch (zone) {
    case 'left':
      return { x: 0, y: 0, width: halfWidth, height: availableHeight };
    case 'right':
      return { x: halfWidth, y: 0, width: width - halfWidth, height: availableHeight };
    case 'top':
      return { x: 0, y: 0, width, height: availableHeight };
    case 'bottom':
      return { x: 0, y: halfHeight, width, height: availableHeight - halfHeight };
    case 'top-left':
      return { x: 0, y: 0, width: halfWidth, height: halfHeight };
    case 'top-right':
      return { x: halfWidth, y: 0, width: width - halfWidth, height: halfHeight };
    case 'bottom-left':
      return { x: 0, y: halfHeight, width: halfWidth, height: availableHeight - halfHeight };
    case 'bottom-right':
      return { x: halfWidth, y: halfHeight, width: width - halfWidth, height: availableHeight - halfHeight };
    default:
      return { x: 40, y: 40, width: Math.min(800, width - 80), height: Math.min(500, availableHeight - 80) };
  }
};

export const detectSnapZone = (
  pointerX: number,
  pointerY: number,
  viewport: ViewportDimensions = getViewportDimensions()
): SnapZone => {
  const { width, availableHeight } = viewport;
  const cornerSize = 40;

  // Corners
  if (pointerX <= cornerSize && pointerY <= cornerSize) return 'top-left';
  if (pointerX >= width - cornerSize && pointerY <= cornerSize) return 'top-right';
  if (pointerX <= cornerSize && pointerY >= availableHeight - cornerSize) return 'bottom-left';
  if (pointerX >= width - cornerSize && pointerY >= availableHeight - cornerSize) return 'bottom-right';

  // Edges
  if (pointerY <= SNAP_THRESHOLD) return 'top';
  if (pointerX <= SNAP_THRESHOLD) return 'left';
  if (pointerX >= width - SNAP_THRESHOLD) return 'right';

  return 'none';
};

export const clampBoundsToViewport = (
  bounds: WindowBounds,
  minWidth = DEFAULT_MIN_WIDTH,
  minHeight = DEFAULT_MIN_HEIGHT,
  viewport: ViewportDimensions = getViewportDimensions()
): WindowBounds => {
  const { width, availableHeight } = viewport;
  const clampedWidth = Math.max(minWidth, Math.min(bounds.width, width));
  const clampedHeight = Math.max(minHeight, Math.min(bounds.height, availableHeight));

  const minVisibleHeader = 60;
  const clampedX = Math.max(-clampedWidth + minVisibleHeader, Math.min(bounds.x, width - minVisibleHeader));
  const clampedY = Math.max(0, Math.min(bounds.y, availableHeight - 38));

  return {
    x: clampedX,
    y: clampedY,
    width: clampedWidth,
    height: clampedHeight,
  };
};
