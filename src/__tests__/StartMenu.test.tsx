import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StartMenu } from '../shell/startmenu/StartMenu';
import { useStartMenuStore } from '../stores/startMenuStore';

describe('Start Menu Subsystem', () => {
  beforeEach(() => {
    useStartMenuStore.setState({
      isOpen: true,
      viewMode: 'pinned',
      searchQuery: '',
      selectedCategory: null,
      selectedAppIndex: 0,
    });
  });

  it('renders start menu header, pinned apps, and power footer', () => {
    const handleOpenApp = vi.fn();
    render(<StartMenu onOpenApp={handleOpenApp} />);

    expect(screen.getByTestId('start-menu')).toBeInTheDocument();
    expect(screen.getByText('WebOS Explorer')).toBeInTheDocument();
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getByTestId('start-menu-search-input')).toBeInTheDocument();
  });

  it('filters apps dynamically when typing in search box', () => {
    const handleOpenApp = vi.fn();
    render(<StartMenu onOpenApp={handleOpenApp} />);

    const searchInput = screen.getByTestId('start-menu-search-input');
    fireEvent.change(searchInput, { target: { value: 'terminal' } });

    expect(screen.getByText('Search Results (1)')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
  });

  it('switches between pinned view and all-apps view', () => {
    const handleOpenApp = vi.fn();
    render(<StartMenu onOpenApp={handleOpenApp} />);

    const allAppsBtn = screen.getByTestId('start-menu-all-apps-btn');
    fireEvent.click(allAppsBtn);

    expect(screen.getByText('All Applications')).toBeInTheDocument();

    const backBtn = screen.getByTestId('start-menu-back-btn');
    fireEvent.click(backBtn);

    expect(screen.getByText('Pinned')).toBeInTheDocument();
  });

  it('launches an application and closes start menu', () => {
    const handleOpenApp = vi.fn();
    render(<StartMenu onOpenApp={handleOpenApp} />);

    const pcAppBtn = screen.getByTestId('start-app-pc');
    fireEvent.click(pcAppBtn);

    expect(handleOpenApp).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pc', name: 'This PC' })
    );
    expect(useStartMenuStore.getState().isOpen).toBe(false);
  });
});
