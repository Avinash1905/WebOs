import type { DndState, DragItem, DragPosition, DropTarget } from './dndTypes';

export const DRAG_ACTIVATION_THRESHOLD = 5; // pixels

export interface DndStateMachineConfig {
  onStateChange?: (state: DndState, item: DragItem | null) => void;
  onDrop?: (item: DragItem, target: DropTarget | null, pos: DragPosition) => void;
  onCancel?: (item: DragItem) => void;
}

export class DndStateMachine {
  private state: DndState = 'idle';
  private activeItem: DragItem | null = null;
  private startPosition: DragPosition = { x: 0, y: 0 };
  private currentPosition: DragPosition = { x: 0, y: 0 };
  private activeDropTarget: DropTarget | null = null;
  private dropTargets: Map<string, DropTarget> = new Map();
  private config: DndStateMachineConfig;

  constructor(config: DndStateMachineConfig = {}) {
    this.config = config;
  }

  getState(): DndState {
    return this.state;
  }

  getActiveItem(): DragItem | null {
    return this.activeItem;
  }

  getActiveDropTarget(): DropTarget | null {
    return this.activeDropTarget;
  }

  registerDropTarget(target: DropTarget): () => void {
    this.dropTargets.set(target.id, target);
    return () => {
      this.dropTargets.delete(target.id);
    };
  }

  handlePointerDown(item: Omit<DragItem, 'initialPosition' | 'currentPosition'>, pos: DragPosition): void {
    if (this.state !== 'idle') return;

    this.startPosition = pos;
    this.currentPosition = pos;
    this.activeItem = {
      ...item,
      initialPosition: pos,
      currentPosition: pos,
    };
    this.transitionTo('pointerdown');
  }

  handlePointerMove(pos: DragPosition): void {
    if (this.state === 'idle' || !this.activeItem) return;

    this.currentPosition = pos;
    this.activeItem.currentPosition = pos;

    const dx = Math.abs(pos.x - this.startPosition.x);
    const dy = Math.abs(pos.y - this.startPosition.y);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (this.state === 'pointerdown') {
      if (distance >= DRAG_ACTIVATION_THRESHOLD) {
        this.transitionTo('dragging');
      }
      return;
    }

    if (this.state === 'dragging' || this.state === 'overdroptarget') {
      // Find matching drop target under pointer
      const matchedTarget = this.findDropTargetAt(pos);
      if (matchedTarget) {
        this.activeDropTarget = matchedTarget;
        this.transitionTo('overdroptarget');
      } else {
        this.activeDropTarget = null;
        this.transitionTo('dragging');
      }
    }
  }

  handlePointerUp(): void {
    if (this.state === 'idle') return;

    if (this.state === 'pointerdown') {
      // Simple click, not a drag
      this.transitionTo('idle');
      this.activeItem = null;
      return;
    }

    if (this.state === 'dragging' || this.state === 'overdroptarget') {
      if (this.activeItem) {
        this.transitionTo('dropping');
        if (this.activeDropTarget && this.activeDropTarget.onDrop) {
          this.activeDropTarget.onDrop(this.activeItem, this.currentPosition);
        }
        this.config.onDrop?.(this.activeItem, this.activeDropTarget, this.currentPosition);
      }
      this.transitionTo('completed');
      this.activeItem = null;
      this.activeDropTarget = null;
      this.transitionTo('idle');
    }
  }

  handleCancel(): void {
    if (this.state === 'idle') return;

    if (this.activeItem) {
      this.config.onCancel?.(this.activeItem);
    }
    this.transitionTo('cancelled');
    this.activeItem = null;
    this.activeDropTarget = null;
    this.transitionTo('idle');
  }

  private findDropTargetAt(pos: DragPosition): DropTarget | null {
    if (!this.activeItem) return null;

    for (const target of this.dropTargets.values()) {
      if (!target.accepts(this.activeItem)) continue;

      const { left, top, right, bottom } = target.bounds;
      if (pos.x >= left && pos.x <= right && pos.y >= top && pos.y <= bottom) {
        return target;
      }
    }
    return null;
  }

  private transitionTo(newState: DndState): void {
    this.state = newState;
    this.config.onStateChange?.(newState, this.activeItem);
  }
}
