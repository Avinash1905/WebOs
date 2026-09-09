import { useRef, useCallback } from 'react';
import { useDndStore } from '../stores/dndStore';
import type { DragItem, DragPosition } from './dndTypes';

export interface UseDraggableOptions<TData = unknown> {
  id: string;
  type: string;
  data: TData;
  disabled?: boolean;
}

export const useDraggable = <TData = unknown>({
  id,
  type,
  data,
  disabled = false,
}: UseDraggableOptions<TData>) => {
  const startDrag = useDndStore((state) => state.startDrag);
  const updateDrag = useDndStore((state) => state.updateDrag);
  const endDrag = useDndStore((state) => state.endDrag);
  const cancelDrag = useDndStore((state) => state.cancelDrag);
  const activeItem = useDndStore((state) => state.activeItem);
  const dndState = useDndStore((state) => state.state);

  const isDragging = activeItem?.id === id && (dndState === 'dragging' || dndState === 'overdroptarget');
  const elementRef = useRef<HTMLElement | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;

      const pos: DragPosition = { x: e.clientX, y: e.clientY };
      const item: Omit<DragItem<TData>, 'initialPosition' | 'currentPosition'> = {
        id,
        type,
        data,
      };

      startDrag(item as Omit<DragItem, 'initialPosition' | 'currentPosition'>, pos);

      const handlePointerMove = (ev: PointerEvent) => {
        updateDrag({ x: ev.clientX, y: ev.clientY });
      };

      const handlePointerUp = () => {
        endDrag();
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('keydown', handleKeyDown);
      };

      const handleKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') {
          cancelDrag();
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
          window.removeEventListener('keydown', handleKeyDown);
        }
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('keydown', handleKeyDown);
    },
    [disabled, id, type, data, startDrag, updateDrag, endDrag, cancelDrag]
  );

  return {
    ref: elementRef,
    isDragging,
    dragProps: {
      onPointerDown: handlePointerDown,
      style: {
        touchAction: 'none' as const,
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.45 : 1,
      },
    },
  };
};
