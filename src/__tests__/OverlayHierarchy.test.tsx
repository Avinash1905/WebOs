import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOverlayStore } from '../stores/overlayStore';

describe('Overlay Hierarchy & Dismissal Stack', () => {
  beforeEach(() => {
    useOverlayStore.setState({ activeOverlays: [] });
  });

  it('registers overlays in descending order of priority', () => {
    const dismissStart = vi.fn();
    const dismissSearch = vi.fn();
    const dismissContext = vi.fn();

    useOverlayStore.getState().registerOverlay({
      id: 'start-menu',
      type: 'start-menu',
      priority: 10,
      onDismiss: dismissStart,
    });

    useOverlayStore.getState().registerOverlay({
      id: 'context-menu',
      type: 'context-menu',
      priority: 100,
      onDismiss: dismissContext,
    });

    useOverlayStore.getState().registerOverlay({
      id: 'search',
      type: 'search',
      priority: 80,
      onDismiss: dismissSearch,
    });

    // Top overlay should be highest priority (context-menu: 100)
    expect(useOverlayStore.getState().activeOverlays[0].id).toBe('context-menu');
    expect(useOverlayStore.getState().activeOverlays[1].id).toBe('search');
    expect(useOverlayStore.getState().activeOverlays[2].id).toBe('start-menu');

    // Dismiss top overlay
    const handled = useOverlayStore.getState().dismissTopOverlay();
    expect(handled).toBe(true);
    expect(dismissContext).toHaveBeenCalledTimes(1);
    expect(dismissSearch).not.toHaveBeenCalled();

    // Dismiss next top overlay (search: 80)
    useOverlayStore.getState().dismissTopOverlay();
    expect(dismissSearch).toHaveBeenCalledTimes(1);
  });
});
