import type { ReactNode } from 'react';

export type DndState =
  | 'idle'
  | 'pointerdown'
  | 'dragcandidate'
  | 'dragging'
  | 'overdroptarget'
  | 'dropping'
  | 'cancelled'
  | 'completed';

export interface DragPosition {
  x: number;
  y: number;
}

export interface DragDelta {
  dx: number;
  dy: number;
}

export interface DragItem<TData = unknown> {
  id: string;
  type: string;
  data: TData;
  initialPosition: DragPosition;
  currentPosition: DragPosition;
  dragPreview?: ReactNode;
}

export interface DropTarget<TTargetData = unknown> {
  id: string;
  type: string;
  bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  data?: TTargetData;
  accepts: (item: DragItem) => boolean;
  onDrop?: (item: DragItem, position: DragPosition) => void;
}

export interface DndSession {
  state: DndState;
  activeItem: DragItem | null;
  activeDropTargetId: string | null;
  startPosition: DragPosition;
  currentPosition: DragPosition;
}
