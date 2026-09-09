import { useEffect, useRef } from 'react';
import { useDndStore } from '../stores/dndStore';
import type { DragItem, DragPosition, DropTarget } from './dndTypes';

export interface UseDroppableOptions<TTargetData = unknown> {
  id: string;
  type: string;
  data?: TTargetData;
  accepts?: (item: DragItem) => boolean;
  onDrop?: (item: DragItem, pos: DragPosition) => void;
}

export const useDroppable = <TTargetData = unknown>({
  id,
  type,
  data,
  accepts = () => true,
  onDrop,
}: UseDroppableOptions<TTargetData>) => {
  const registerDropTarget = useDndStore((state) => state.registerDropTarget);
  const activeDropTarget = useDndStore((state) => state.activeDropTarget);
  const isOver = activeDropTarget?.id === id;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const updateBoundsAndRegister = () => {
      if (!ref.current) return () => {};
      const rect = ref.current.getBoundingClientRect();
      const target: DropTarget<TTargetData> = {
        id,
        type,
        bounds: {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
        },
        data,
        accepts,
        onDrop,
      };
      return registerDropTarget(target as DropTarget);
    };

    const unregister = updateBoundsAndRegister();
    return () => {
      unregister();
    };
  }, [id, type, data, accepts, onDrop, registerDropTarget]);

  return {
    ref,
    isOver,
  };
};
