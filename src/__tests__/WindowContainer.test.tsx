import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { WindowContainer } from '../shell/window/WindowContainer';
import { useWindowStore } from '../stores/windowStore';
import type { WindowInstance } from '../types/window';

describe('Window Container & Controls', () => {
  const sampleWindow: WindowInstance = {
    id: 'test-win-1',
    appId: 'pc',
    title: 'This PC',
    state: 'normal',
    bounds: { x: 50, y: 50, width: 640, height: 480 },
    isFocused: true,
    zIndex: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    useWindowStore.setState({
      windows: [sampleWindow],
      activeWindowId: 'test-win-1',
      focusedWindowId: 'test-win-1',
    });
  });

  it('renders window container with title and control buttons', () => {
    render(<WindowContainer window={sampleWindow} />);

    expect(screen.getByTestId('window-test-win-1')).toBeInTheDocument();
    expect(screen.getByTestId('window-titlebar-test-win-1')).toHaveTextContent('This PC');
    expect(screen.getByTestId('window-minimize-button')).toBeInTheDocument();
    expect(screen.getByTestId('window-maximize-button')).toBeInTheDocument();
    expect(screen.getByTestId('window-close-button')).toBeInTheDocument();
  });

  it('minimizes window when minimize button is clicked', () => {
    render(<WindowContainer window={sampleWindow} />);

    const minBtn = screen.getByTestId('window-minimize-button');
    fireEvent.click(minBtn);

    expect(useWindowStore.getState().windows[0].state).toBe('minimized');
  });

  it('maximizes and restores window on maximize button click and titlebar double click', () => {
    const { rerender } = render(<WindowContainer window={sampleWindow} />);

    const maxBtn = screen.getByTestId('window-maximize-button');
    fireEvent.click(maxBtn);

    expect(useWindowStore.getState().windows[0].state).toBe('maximized');

    // Re-render to propagate updated state
    rerender(<WindowContainer window={useWindowStore.getState().windows[0]} />);

    const titlebar = screen.getByTestId('window-titlebar-test-win-1');
    fireEvent.doubleClick(titlebar);

    expect(useWindowStore.getState().windows[0].state).toBe('normal');
  });

  it('closes window when close button is clicked', () => {
    render(<WindowContainer window={sampleWindow} />);

    const closeBtn = screen.getByTestId('window-close-button');
    fireEvent.click(closeBtn);

    expect(useWindowStore.getState().windows).toHaveLength(0);
  });
});
