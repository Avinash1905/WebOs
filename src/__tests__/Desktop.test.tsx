import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DesktopShell } from '../shell/desktop/DesktopShell';
import { useDesktopStore } from '../stores/desktopStore';
import { DEFAULT_SYSTEM_ICONS } from '../shell/desktop/defaultIcons';

describe('Desktop Environment & Icons', () => {
  beforeEach(() => {
    useDesktopStore.setState({
      icons: DEFAULT_SYSTEM_ICONS,
      selectedIconIds: [],
      focusedIconId: null,
      contextMenu: null,
    });
  });

  it('renders desktop shell and all registered system icons', () => {
    const handleOpenApp = vi.fn();
    render(<DesktopShell onOpenApp={handleOpenApp} />);

    expect(screen.getByTestId('desktop-shell')).toBeInTheDocument();
    expect(screen.getByText('This PC')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Recycle Bin')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('selects desktop icon on single click', () => {
    const handleOpenApp = vi.fn();
    render(<DesktopShell onOpenApp={handleOpenApp} />);

    const pcIcon = screen.getByTestId('desktop-icon-pc');
    fireEvent.click(pcIcon);

    expect(pcIcon).toHaveAttribute('aria-selected', 'true');
    expect(useDesktopStore.getState().selectedIconIds).toContain('icon-pc');
  });

  it('triggers application launch on double click', () => {
    const handleOpenApp = vi.fn();
    render(<DesktopShell onOpenApp={handleOpenApp} />);

    const terminalIcon = screen.getByTestId('desktop-icon-terminal');
    fireEvent.doubleClick(terminalIcon);

    expect(handleOpenApp).toHaveBeenCalledTimes(1);
    expect(handleOpenApp).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 'terminal', title: 'Terminal' })
    );
  });

  it('triggers application launch on Enter key press', () => {
    const handleOpenApp = vi.fn();
    render(<DesktopShell onOpenApp={handleOpenApp} />);

    const settingsIcon = screen.getByTestId('desktop-icon-settings');
    fireEvent.keyDown(settingsIcon, { key: 'Enter', code: 'Enter' });

    expect(handleOpenApp).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 'settings', title: 'Settings' })
    );
  });

  it('opens context menu on right click on desktop surface', () => {
    const handleOpenApp = vi.fn();
    render(<DesktopShell onOpenApp={handleOpenApp} />);

    const surface = screen.getByTestId('desktop-surface');
    fireEvent.contextMenu(surface, { clientX: 150, clientY: 200 });

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Refresh Desktop')).toBeInTheDocument();
    expect(screen.getByText('New Folder')).toBeInTheDocument();
    expect(screen.getByText('Next Wallpaper')).toBeInTheDocument();
  });
});
