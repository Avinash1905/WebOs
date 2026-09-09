import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppLauncher } from '../shell/launcher/AppLauncher';
import { useLauncherStore } from '../stores/launcherStore';

describe('Application Launcher / Launchpad', () => {
  beforeEach(() => {
    useLauncherStore.setState({
      isOpen: true,
      viewMode: 'grid',
      searchQuery: '',
      selectedCategory: 'All',
      favoriteAppIds: ['pc', 'terminal'],
    });
  });

  it('renders application launchpad grid with category filters', () => {
    const handleOpenApp = vi.fn();
    render(<AppLauncher onOpenApp={handleOpenApp} />);

    expect(screen.getByTestId('app-launcher')).toBeInTheDocument();
    expect(screen.getByText('Launchpad')).toBeInTheDocument();
    expect(screen.getByTestId('launcher-cat-All')).toBeInTheDocument();
    expect(screen.getByTestId('launcher-cat-Development')).toBeInTheDocument();
    expect(screen.getByTestId('launcher-card-pc')).toBeInTheDocument();
  });

  it('filters apps by category tab', () => {
    const handleOpenApp = vi.fn();
    render(<AppLauncher onOpenApp={handleOpenApp} />);

    const devTab = screen.getByTestId('launcher-cat-Development');
    fireEvent.click(devTab);

    expect(screen.getByTestId('launcher-card-terminal')).toBeInTheDocument();
    expect(screen.queryByTestId('launcher-card-pc')).not.toBeInTheDocument();
  });

  it('switches between grid and list views', () => {
    const handleOpenApp = vi.fn();
    render(<AppLauncher onOpenApp={handleOpenApp} />);

    const listBtn = screen.getByRole('button', { name: /list view/i });
    fireEvent.click(listBtn);

    expect(screen.getByTestId('launcher-row-pc')).toBeInTheDocument();
  });

  it('launches application from launcher card', () => {
    const handleOpenApp = vi.fn();
    render(<AppLauncher onOpenApp={handleOpenApp} />);

    const terminalCard = screen.getByTestId('launcher-card-terminal');
    fireEvent.click(terminalCard);

    expect(handleOpenApp).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'terminal', name: 'Terminal' })
    );
    expect(useLauncherStore.getState().isOpen).toBe(false);
  });
});
