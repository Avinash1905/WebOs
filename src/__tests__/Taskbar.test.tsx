import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Taskbar } from '../shell/taskbar/Taskbar';
import { useTaskbarStore } from '../stores/taskbarStore';
import { useWindowStore } from '../stores/windowStore';

describe('Taskbar & System Tray', () => {
  beforeEach(() => {
    useTaskbarStore.setState({
      isStartMenuOpen: false,
      pinnedAppIds: ['pc', 'terminal'],
      activeTrayMenu: null,
    });
    useWindowStore.setState({
      windows: [],
      activeWindowId: null,
      focusedWindowId: null,
    });
  });

  it('renders taskbar container, start button, and system tray', () => {
    const handleOpenApp = vi.fn();
    render(<Taskbar onOpenApp={handleOpenApp} />);

    expect(screen.getByTestId('taskbar')).toBeInTheDocument();
    expect(screen.getByTestId('start-button')).toBeInTheDocument();
    expect(screen.getByTestId('system-tray')).toBeInTheDocument();
    expect(screen.getByTestId('taskbar-clock')).toBeInTheDocument();
  });

  it('toggles start menu state on start button click', () => {
    const handleOpenApp = vi.fn();
    render(<Taskbar onOpenApp={handleOpenApp} />);

    const startBtn = screen.getByTestId('start-button');
    expect(startBtn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(startBtn);
    expect(startBtn).toHaveAttribute('aria-expanded', 'true');
    expect(useTaskbarStore.getState().isStartMenuOpen).toBe(true);

    fireEvent.click(startBtn);
    expect(useTaskbarStore.getState().isStartMenuOpen).toBe(false);
  });

  it('renders running window buttons in the taskbar app area', () => {
    useWindowStore.setState({
      windows: [
        {
          id: 'win-1',
          appId: 'terminal',
          title: 'Terminal - bash',
          state: 'normal',
          bounds: { x: 100, y: 100, width: 600, height: 400 },
          isFocused: true,
          zIndex: 101,
        },
      ],
      activeWindowId: 'win-1',
      focusedWindowId: 'win-1',
    });

    const handleOpenApp = vi.fn();
    render(<Taskbar onOpenApp={handleOpenApp} />);

    const taskbarApp = screen.getByTestId('taskbar-app-terminal');
    expect(taskbarApp).toBeInTheDocument();
    expect(screen.getByText('Terminal - bash')).toBeInTheDocument();

    // Clicking active taskbar app minimizes it
    fireEvent.click(taskbarApp);
    expect(useWindowStore.getState().windows[0].state).toBe('minimized');
  });

  it('renders system tray status items (network, volume, battery, notifications)', () => {
    const handleOpenApp = vi.fn();
    render(<Taskbar onOpenApp={handleOpenApp} />);

    expect(screen.getByTestId('tray-network')).toBeInTheDocument();
    expect(screen.getByTestId('tray-volume')).toBeInTheDocument();
    expect(screen.getByTestId('tray-battery')).toBeInTheDocument();
    expect(screen.getByTestId('tray-notifications')).toBeInTheDocument();
  });
});
