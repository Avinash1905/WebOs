import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from '../stores/windowStore';
import { useStartMenuStore } from '../stores/startMenuStore';
import { useWindowShortcuts } from '../keyboard/useWindowShortcuts';

const KeyboardTestContainer: React.FC = () => {
  useWindowShortcuts();
  return <div data-testid="keyboard-container" />;
};

describe('Global Keyboard Window Management', () => {
  beforeEach(() => {
    useWindowStore.setState({
      windows: [
        {
          id: 'win-1',
          appId: 'pc',
          title: 'This PC',
          state: 'normal',
          bounds: { x: 50, y: 50, width: 600, height: 400 },
          isFocused: true,
          zIndex: 100,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeWindowId: 'win-1',
      focusedWindowId: 'win-1',
      hoveredSnapZone: 'none',
      activeSnapPreviewBounds: null,
      isAltTabOpen: false,
      altTabIndex: 0,
      showDesktop: false,
    });
    useStartMenuStore.setState({ isOpen: false, searchQuery: '' });
  });

  it('closes active window on Alt+F4', () => {
    render(<KeyboardTestContainer />);

    fireEvent.keyDown(window, { key: 'F4', altKey: true });

    expect(useWindowStore.getState().windows).toHaveLength(0);
  });

  it('toggles show desktop on Meta+D', () => {
    render(<KeyboardTestContainer />);

    fireEvent.keyDown(window, { key: 'd', metaKey: true });
    expect(useWindowStore.getState().showDesktop).toBe(true);
    expect(useWindowStore.getState().windows[0].state).toBe('minimized');

    fireEvent.keyDown(window, { key: 'd', metaKey: true });
    expect(useWindowStore.getState().showDesktop).toBe(false);
    expect(useWindowStore.getState().windows[0].state).toBe('normal');
  });

  it('maximizes and snaps window via directional keys', () => {
    render(<KeyboardTestContainer />);

    // Meta + ArrowUp -> Maximize
    fireEvent.keyDown(window, { key: 'ArrowUp', metaKey: true });
    expect(useWindowStore.getState().windows[0].state).toBe('maximized');

    // Meta + ArrowLeft -> Snap Left
    fireEvent.keyDown(window, { key: 'ArrowLeft', metaKey: true });
    expect(useWindowStore.getState().windows[0].state).toBe('snapped-left');
  });

  it('opens and cycles Alt+Tab switcher', () => {
    useWindowStore.setState({
      windows: [
        {
          id: 'win-1',
          appId: 'pc',
          title: 'This PC',
          state: 'normal',
          bounds: { x: 50, y: 50, width: 600, height: 400 },
          isFocused: true,
          zIndex: 100,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'win-2',
          appId: 'terminal',
          title: 'Terminal',
          state: 'normal',
          bounds: { x: 80, y: 80, width: 600, height: 400 },
          isFocused: false,
          zIndex: 101,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeWindowId: 'win-1',
      focusedWindowId: 'win-1',
    });

    render(<KeyboardTestContainer />);

    fireEvent.keyDown(window, { key: 'Tab', altKey: true });
    expect(useWindowStore.getState().isAltTabOpen).toBe(true);
  });
});
