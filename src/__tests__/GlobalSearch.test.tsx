import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSearchStore } from '../stores/searchStore';
import { searchEngine } from '../search/searchEngine';
import { GlobalSearchOverlay } from '../shell/search/GlobalSearchOverlay';

describe('Global Search & Spotlight Subsystem', () => {
  beforeEach(() => {
    useSearchStore.setState({
      isOpen: false,
      query: '',
      results: [],
      selectedIndex: 0,
      selectedCategory: 'All',
      isLoading: false,
      recentQueries: ['terminal', 'display'],
    });
  });

  it('searches across registered apps via searchEngine', async () => {
    const results = await searchEngine.search('term');
    expect(results.length).toBeGreaterThan(0);
    const termApp = results.find((r) => r.title.toLowerCase().includes('terminal'));
    expect(termApp).toBeDefined();
    expect(termApp?.category).toBe('Applications');
  });

  it('searches settings and OS commands', async () => {
    const settingResults = await searchEngine.search('wallpaper');
    expect(settingResults.some((r) => r.category === 'Settings')).toBe(true);

    const cmdResults = await searchEngine.search('minimize');
    expect(cmdResults.some((r) => r.category === 'Commands')).toBe(true);
  });

  it('renders GlobalSearchOverlay and performs debounced live search', async () => {
    useSearchStore.getState().openSearch();
    render(<GlobalSearchOverlay />);

    const input = screen.getByPlaceholderText(/search webos/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'editor' } });

    await waitFor(() => {
      expect(screen.getByText('Text Editor')).toBeInTheDocument();
    });
  });

  it('navigates results with Arrow keys and executes with Enter', async () => {
    const mockAction = vi.fn();
    useSearchStore.setState({
      isOpen: true,
      query: 'test',
      results: [
        {
          id: 'item-1',
          title: 'First Item',
          category: 'Applications',
          score: 100,
          action: vi.fn(),
        },
        {
          id: 'item-2',
          title: 'Second Item',
          category: 'Applications',
          score: 90,
          action: mockAction,
        },
      ],
      selectedIndex: 0,
    });

    render(<GlobalSearchOverlay />);

    const modal = screen.getByRole('dialog', { name: /webos spotlight search/i });

    // Arrow down
    fireEvent.keyDown(modal, { key: 'ArrowDown' });
    expect(useSearchStore.getState().selectedIndex).toBe(1);

    // Enter
    fireEvent.keyDown(modal, { key: 'Enter' });
    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(useSearchStore.getState().isOpen).toBe(false);
  });
});
