import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskbarAppArea } from '../shell/taskbar/TaskbarAppArea';
import { useWindowStore } from '../stores/windowStore';
import { useTaskbarStore } from '../stores/taskbarStore';

describe('Taskbar Application Grouping & Context Menus', () => {
  beforeEach(() => {
    useWindowStore.setState({
      windows: [],
      activeWindowId: null,
      focusedWindowId: null,
    });
    useTaskbarStore.setState({
      pinnedAppIds: ['pc'],
    });
  });

  it('displays group badge when multiple instances of the same app are open', () => {
    useWindowStore.setState({
      windows: [
        {
          id: 'win-term-1',
          appId: 'terminal',
          title: 'Terminal 1',
          state: 'normal',
          bounds: { x: 50, y: 50, width: 600, height: 400 },
          isFocused: true,
          zIndex: 100,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'win-term-2',
          appId: 'terminal',
          title: 'Terminal 2',
          state: 'normal',
          bounds: { x: 80, y: 80, width: 600, height: 400 },
          isFocused: false,
          zIndex: 101,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeWindowId: 'win-term-1',
      focusedWindowId: 'win-term-1',
    });

    const handleOpenApp = vi.fn();
    render(<TaskbarAppArea onOpenApp={handleOpenApp} />);

    expect(screen.getByTestId('taskbar-app-terminal')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Badge count
  });

  it('opens taskbar context menu on right click with Pin/Unpin and Close actions', () => {
    useWindowStore.setState({
      windows: [
        {
          id: 'win-term-1',
          appId: 'terminal',
          title: 'Terminal',
          state: 'normal',
          bounds: { x: 50, y: 50, width: 600, height: 400 },
          isFocused: true,
          zIndex: 100,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeWindowId: 'win-term-1',
      focusedWindowId: 'win-term-1',
    });

    const handleOpenApp = vi.fn();
    render(<TaskbarAppArea onOpenApp={handleOpenApp} />);

    const appBtn = screen.getByTestId('taskbar-app-terminal');
    fireEvent.contextMenu(appBtn, { clientX: 200, clientY: 500 });

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Pin to taskbar')).toBeInTheDocument();
    expect(screen.getByText('Close Window')).toBeInTheDocument();
  });
});
