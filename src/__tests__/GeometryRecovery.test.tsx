import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from '../stores/windowStore';
import { DisplayManager } from '../wm/DisplayManager';

describe('DisplayManager and Geometry Recovery', () => {
  beforeEach(() => {
    useWindowStore.setState({
      windows: [],
      activeWindowId: null,
      focusedWindowId: null,
    });
  });

  it('clamps offscreen window coordinates inside viewport bounds', () => {
    const displayMgr = DisplayManager.getInstance();
    const offscreenRect = { x: -500, y: -200, width: 800, height: 600 };
    const clamped = displayMgr.clampWindowGeometry(offscreenRect);

    expect(clamped.x).toBeGreaterThanOrEqual(0);
    expect(clamped.y).toBeGreaterThanOrEqual(0);
    expect(clamped.width).toBeGreaterThan(0);
    expect(clamped.height).toBeGreaterThan(0);
  });

  it('calculates cascade positions for multiple windows', () => {
    const displayMgr = DisplayManager.getInstance();
    const win1 = displayMgr.calculateCascadePosition(0);
    const win2 = displayMgr.calculateCascadePosition(1);
    const win3 = displayMgr.calculateCascadePosition(2);

    expect(win2.x).toBeGreaterThan(win1.x);
    expect(win2.y).toBeGreaterThan(win1.y);
    expect(win3.x).toBeGreaterThan(win2.x);
    expect(win3.y).toBeGreaterThan(win2.y);
  });

  it('calculates grid tiling layout for multi-window management', () => {
    const displayMgr = DisplayManager.getInstance();
    const tiles = displayMgr.calculateTileLayout(4);

    expect(tiles.length).toBe(4);
    expect(tiles[0].width).toBeGreaterThan(0);
    expect(tiles[0].height).toBeGreaterThan(0);
    // 2x2 grid check
    expect(tiles[1].x).toBeGreaterThan(tiles[0].x);
    expect(tiles[2].y).toBeGreaterThan(tiles[0].y);
  });

  it('recovers offscreen windows across the window store', () => {
    const { openWindow, updateWindowBounds, recoverOffscreenWindows } = useWindowStore.getState();

    const id = openWindow({
      id: 'test-offscreen',
      appId: 'editor',
      title: 'Editor',
    });

    // Move it way offscreen
    updateWindowBounds(id, { x: 5000, y: 5000 });
    let win = useWindowStore.getState().windows.find((w) => w.id === id);
    expect(win?.bounds.x).toBe(5000);

    // Trigger recovery
    recoverOffscreenWindows();
    win = useWindowStore.getState().windows.find((w) => w.id === id);
    expect(win?.bounds.x).toBeLessThan(5000);
    expect(win?.bounds.y).toBeLessThan(5000);
  });

  it('applies cascade and tile arrangements to store windows', () => {
    const { openWindow, cascadeWindows, tileWindows } = useWindowStore.getState();

    const id1 = openWindow({ id: 'win-1', appId: 'editor', title: 'Win 1' });
    const id2 = openWindow({ id: 'win-2', appId: 'terminal', title: 'Win 2' });

    cascadeWindows();
    const stateCascade = useWindowStore.getState().windows;
    expect(stateCascade.find((w) => w.id === id2)!.bounds.x).toBeGreaterThan(
      stateCascade.find((w) => w.id === id1)!.bounds.x
    );

    tileWindows();
    const stateTile = useWindowStore.getState().windows;
    expect(stateTile.length).toBe(2);
    expect(stateTile[0].bounds.width).toBeGreaterThanOrEqual(100);
    expect(stateTile[1].bounds.width).toBeGreaterThanOrEqual(100);
  });
});
