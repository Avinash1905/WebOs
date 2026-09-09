import { useRef, useCallback } from 'react';
import type { WindowInstance, ResizeDirection } from '../types/window';
import { useWindowStore } from '../stores/windowStore';
import {
  getViewportDimensions,
  DEFAULT_MIN_WIDTH,
  DEFAULT_MIN_HEIGHT,
} from './WindowGeometry';

export interface UseWindowResizeOptions {
  window: WindowInstance;
  disabled?: boolean;
}

export const useWindowResize = ({ window: win, disabled = false }: UseWindowResizeOptions) => {
  const isResizingRef = useRef(false);
  const resizeDataRef = useRef({
    direction: 'se' as ResizeDirection,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialWidth: 0,
    initialHeight: 0,
  });

  const { focusWindow, updateWindowBounds, restoreWindow } = useWindowStore();

  const handleResizeStart = useCallback(
    (direction: ResizeDirection, e: React.PointerEvent) => {
      if (disabled || win.canResize === false || e.button !== 0) return;
      e.stopPropagation();

      // If window was maximized or snapped, restore it to normal bounds before resizing
      if (win.state !== 'normal') {
        restoreWindow(win.id);
      }

      focusWindow(win.id);
      isResizingRef.current = true;
      resizeDataRef.current = {
        direction,
        startX: e.clientX,
        startY: e.clientY,
        initialX: win.bounds.x,
        initialY: win.bounds.y,
        initialWidth: win.bounds.width,
        initialHeight: win.bounds.height,
      };

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture?.(e.pointerId);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!isResizingRef.current) return;

        const deltaX = moveEvent.clientX - resizeDataRef.current.startX;
        const deltaY = moveEvent.clientY - resizeDataRef.current.startY;

        const {
          direction: dir,
          initialX,
          initialY,
          initialWidth,
          initialHeight,
        } = resizeDataRef.current;

        const minW = win.minWidth ?? DEFAULT_MIN_WIDTH;
        const minH = win.minHeight ?? DEFAULT_MIN_HEIGHT;
        const maxW = win.maxWidth ?? 4000;
        const maxH = win.maxHeight ?? 4000;

        const viewport = getViewportDimensions();
        let newX = initialX;
        let newY = initialY;
        let newW = initialWidth;
        let newH = initialHeight;

        // East / West
        if (dir.includes('e')) {
          newW = Math.max(minW, Math.min(maxW, initialWidth + deltaX));
          newW = Math.min(newW, viewport.width - initialX);
        } else if (dir.includes('w')) {
          const possibleW = initialWidth - deltaX;
          if (possibleW >= minW && possibleW <= maxW) {
            newW = possibleW;
            newX = initialX + deltaX;
          } else if (possibleW < minW) {
            newW = minW;
            newX = initialX + (initialWidth - minW);
          }
        }

        // South / North
        if (dir.includes('s')) {
          newH = Math.max(minH, Math.min(maxH, initialHeight + deltaY));
          newH = Math.min(newH, viewport.availableHeight - initialY);
        } else if (dir.includes('n')) {
          const possibleH = initialHeight - deltaY;
          if (possibleH >= minH && possibleH <= maxH) {
            newH = possibleH;
            newY = Math.max(0, initialY + deltaY);
          } else if (possibleH < minH) {
            newH = minH;
            newY = initialY + (initialHeight - minH);
          }
        }

        updateWindowBounds(win.id, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        if (!isResizingRef.current) return;
        isResizingRef.current = false;

        try {
          target.releasePointerCapture?.(upEvent.pointerId);
        } catch {
          // Ignore
        }

        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    },
    [disabled, win, focusWindow, restoreWindow, updateWindowBounds]
  );

  return {
    handleResizeStart,
  };
};
