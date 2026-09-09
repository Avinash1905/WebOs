import { useRef, useCallback } from 'react';
import type { WindowInstance } from '../types/window';
import { useWindowStore } from '../stores/windowStore';
import {
  detectSnapZone,
  calculateSnapBounds,
  getViewportDimensions,
  clampBoundsToViewport,
} from './WindowGeometry';

export interface UseWindowDragOptions {
  window: WindowInstance;
  disabled?: boolean;
}

export const useWindowDrag = ({ window: win, disabled = false }: UseWindowDragOptions) => {
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ pointerX: 0, pointerY: 0, winX: 0, winY: 0 });

  const {
    focusWindow,
    updateWindowBounds,
    snapWindow,
    restoreWindow,
    setHoveredSnapZone,
  } = useWindowStore();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || win.canDrag === false || e.button !== 0) return;

      // Unsnap or unmaximize on drag if was maximized or snapped
      if (win.state === 'maximized' || win.state.startsWith('snapped-') || win.state === 'fullscreen') {
        const restoreWidth = win.previousBounds?.width ?? 780;
        const newX = Math.max(0, e.clientX - restoreWidth / 2);
        restoreWindow(win.id);
        updateWindowBounds(win.id, { x: newX, y: e.clientY - 15 });
        startPosRef.current = {
          pointerX: e.clientX,
          pointerY: e.clientY,
          winX: newX,
          winY: e.clientY - 15,
        };
      } else {
        startPosRef.current = {
          pointerX: e.clientX,
          pointerY: e.clientY,
          winX: win.bounds.x,
          winY: win.bounds.y,
        };
      }

      isDraggingRef.current = true;
      focusWindow(win.id);

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture?.(e.pointerId);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!isDraggingRef.current) return;

        const deltaX = moveEvent.clientX - startPosRef.current.pointerX;
        const deltaY = moveEvent.clientY - startPosRef.current.pointerY;

        const viewport = getViewportDimensions();
        const rawBounds = {
          x: startPosRef.current.winX + deltaX,
          y: startPosRef.current.winY + deltaY,
          width: win.bounds.width,
          height: win.bounds.height,
        };

        const clamped = clampBoundsToViewport(
          rawBounds,
          win.minWidth,
          win.minHeight,
          viewport
        );

        updateWindowBounds(win.id, { x: clamped.x, y: clamped.y });

        // Check snap zone
        const snapZone = detectSnapZone(moveEvent.clientX, moveEvent.clientY, viewport);
        if (snapZone !== 'none') {
          const previewBounds = calculateSnapBounds(snapZone, viewport);
          setHoveredSnapZone(snapZone, previewBounds);
        } else {
          setHoveredSnapZone('none', null);
        }
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;

        try {
          target.releasePointerCapture?.(upEvent.pointerId);
        } catch {
          // Ignore if pointer capture already released
        }

        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);

        const viewport = getViewportDimensions();
        const snapZone = detectSnapZone(upEvent.clientX, upEvent.clientY, viewport);
        setHoveredSnapZone('none', null);

        if (snapZone !== 'none') {
          snapWindow(win.id, snapZone);
        }
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    },
    [disabled, win, focusWindow, restoreWindow, updateWindowBounds, setHoveredSnapZone, snapWindow]
  );

  return {
    handlePointerDown,
  };
};
