import { create } from 'zustand';
import type { DndState, DragItem, DragPosition, DropTarget } from '../dnd/dndTypes';
import { DndStateMachine } from '../dnd/dndStateMachine';

interface DndStoreState {
  state: DndState;
  activeItem: DragItem | null;
  activeDropTarget: DropTarget | null;
  currentPosition: DragPosition;
  stateMachine: DndStateMachine;

  registerDropTarget: (target: DropTarget) => () => void;
  startDrag: (item: Omit<DragItem, 'initialPosition' | 'currentPosition'>, pos: DragPosition) => void;
  updateDrag: (pos: DragPosition) => void;
  endDrag: () => void;
  cancelDrag: () => void;
}

export const useDndStore = create<DndStoreState>((set) => {
  const stateMachine = new DndStateMachine({
    onStateChange: (state, activeItem) => {
      set({
        state,
        activeItem,
        activeDropTarget: stateMachine.getActiveDropTarget(),
      });
    },
  });

  return {
    state: 'idle',
    activeItem: null,
    activeDropTarget: null,
    currentPosition: { x: 0, y: 0 },
    stateMachine,

    registerDropTarget: (target) => {
      return stateMachine.registerDropTarget(target);
    },

    startDrag: (item, pos) => {
      set({ currentPosition: pos });
      stateMachine.handlePointerDown(item, pos);
    },

    updateDrag: (pos) => {
      set({ currentPosition: pos });
      stateMachine.handlePointerMove(pos);
    },

    endDrag: () => {
      stateMachine.handlePointerUp();
    },

    cancelDrag: () => {
      stateMachine.handleCancel();
    },
  };
});
