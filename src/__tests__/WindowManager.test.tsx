import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { WindowManager } from '../wm/WindowManager';
import { useWindowStore } from '../stores/windowStore';

describe('Window Manager & Multi-Window Lifecycle', () => {
  beforeEach(() => {
    useWindowStore.setState({
      windows: [],
      activeWindowId: null,
      focusedWindowId: null,
      hoveredSnapZone: 'none',
      activeSnapPreviewBounds: null,
      isAltTabOpen: false,
      altTabIndex: 0,
      showDesktop: false,
    });
  });

  it('manages multiple simultaneous windows with distinct z-indexes', () => {
    const { openWindow } = useWindowStore.getState();
    const win1 = openWindow({ id: 'win-1', appId: 'pc', title: 'This PC', bounds: { x: 50, y: 50, width: 600, height: 400 } });
    const win2 = openWindow({ id: 'win-2', appId: 'terminal', title: 'Terminal', bounds: { x: 100, y: 100, width: 600, height: 400 } });

    render(<WindowManager />);

    expect(screen.getByTestId('window-win-1')).toBeInTheDocument();
    expect(screen.getByTestId('window-win-2')).toBeInTheDocument();

    const state = useWindowStore.getState();
    const w1 = state.windows.find((w) => w.id === win1);
    const w2 = state.windows.find((w) => w.id === win2);

    expect(w2?.isFocused).toBe(true);
    expect(w2?.zIndex).toBeGreaterThan(w1?.zIndex || 0);
  });

  it('switches focus when clicking on a window', () => {
    const { openWindow } = useWindowStore.getState();
    const win1 = openWindow({ id: 'win-1', appId: 'pc', title: 'This PC' });
    openWindow({ id: 'win-2', appId: 'terminal', title: 'Terminal' });

    render(<WindowManager />);

    const win1Elem = screen.getByTestId('window-win-1');
    fireEvent.mouseDown(win1Elem);

    expect(useWindowStore.getState().focusedWindowId).toBe(win1);
  });

  it('handles window snapping to left half', () => {
    const { openWindow, snapWindow } = useWindowStore.getState();
    const win1 = openWindow({ id: 'win-1', appId: 'pc', title: 'This PC' });

    render(<WindowManager />);

    snapWindow(win1, 'left');

    const updated = useWindowStore.getState().windows.find((w) => w.id === win1);
    expect(updated?.state).toBe('snapped-left');
    expect(updated?.bounds.x).toBe(0);
    expect(updated?.bounds.width).toBeGreaterThan(100);
  });

  it('handles window fullscreen mode toggle', () => {
    const { openWindow, toggleFullscreen } = useWindowStore.getState();
    const win1 = openWindow({ id: 'win-1', appId: 'pc', title: 'This PC' });

    render(<WindowManager />);

    toggleFullscreen(win1);
    let updated = useWindowStore.getState().windows.find((w) => w.id === win1);
    expect(updated?.state).toBe('fullscreen');

    toggleFullscreen(win1);
    updated = useWindowStore.getState().windows.find((w) => w.id === win1);
    expect(updated?.state).toBe('normal');
  });

  it('minimizes and restores window without losing bounds', () => {
    const { openWindow, minimizeWindow, restoreWindow } = useWindowStore.getState();
    const initialBounds = { x: 120, y: 90, width: 700, height: 450 };
    const win1 = openWindow({ id: 'win-1', appId: 'pc', title: 'This PC', bounds: initialBounds });

    render(<WindowManager />);

    minimizeWindow(win1);
    expect(useWindowStore.getState().windows.find((w) => w.id === win1)?.state).toBe('minimized');

    restoreWindow(win1);
    const restored = useWindowStore.getState().windows.find((w) => w.id === win1);
    expect(restored?.state).toBe('normal');
    expect(restored?.bounds.x).toBe(initialBounds.x);
    expect(restored?.bounds.y).toBe(initialBounds.y);
  });
});
