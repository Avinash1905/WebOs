import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DndStateMachine } from '../dnd/dndStateMachine';
import { useDesktopStore } from '../stores/desktopStore';

describe('Drag and Drop Subsystem & Desktop Snapping', () => {
  beforeEach(() => {
    useDesktopStore.setState({
      selectedIconIds: [],
      autoArrange: false,
    });
  });

  it('manages finite state machine transitions from pointerdown to dragging to dropping', () => {
    const handleDrop = vi.fn();
    const sm = new DndStateMachine({ onDrop: handleDrop });

    expect(sm.getState()).toBe('idle');

    // Pointer down
    sm.handlePointerDown({ id: 'item-1', type: 'test', data: {} }, { x: 10, y: 10 });
    expect(sm.getState()).toBe('pointerdown');

    // Move within threshold (no drag yet)
    sm.handlePointerMove({ x: 12, y: 12 });
    expect(sm.getState()).toBe('pointerdown');

    // Move past threshold (triggers dragging)
    sm.handlePointerMove({ x: 30, y: 30 });
    expect(sm.getState()).toBe('dragging');

    // Pointer up triggers drop and returns to idle
    sm.handlePointerUp();
    expect(sm.getState()).toBe('idle');
    expect(handleDrop).toHaveBeenCalledTimes(1);
  });

  it('cancels active drag when handleCancel is invoked', () => {
    const handleCancel = vi.fn();
    const sm = new DndStateMachine({ onCancel: handleCancel });

    sm.handlePointerDown({ id: 'item-1', type: 'test', data: {} }, { x: 0, y: 0 });
    sm.handlePointerMove({ x: 50, y: 50 });
    expect(sm.getState()).toBe('dragging');

    sm.handleCancel();
    expect(sm.getState()).toBe('idle');
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('moves desktop icon coordinates and handles multi-icon offsets', () => {
    const store = useDesktopStore.getState();

    store.moveIcon('icon-pc', 2, 3);
    const pc = useDesktopStore.getState().icons.find((i) => i.id === 'icon-pc');
    expect(pc?.gridCol).toBe(2);
    expect(pc?.gridRow).toBe(3);

    // Multi-icon moving
    store.setSelectedIcons(['icon-pc', 'icon-documents']);
    store.moveSelectedIcons(1, 1);

    const updatedPc = useDesktopStore.getState().icons.find((i) => i.id === 'icon-pc');
    expect(updatedPc?.gridCol).toBe(3);
    expect(updatedPc?.gridRow).toBe(4);
  });
});
