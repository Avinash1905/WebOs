import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useContextMenuStore } from '../stores/contextMenuStore';
import { ContextMenuManager } from '../contextmenu/ContextMenuManager';

describe('Nested Context Menu Subsystem', () => {
  beforeEach(() => {
    useContextMenuStore.setState({ activeMenu: null });
  });

  it('renders ContextMenuManager with multi-level submenus', () => {
    const handleAction = vi.fn();

    useContextMenuStore.getState().openContextMenu({
      id: 'test-menu',
      x: 150,
      y: 150,
      items: [
        {
          id: 'view',
          label: 'View',
          children: [
            {
              id: 'view-large',
              label: 'Large Icons',
              onClick: handleAction,
            },
          ],
        },
        {
          id: 'refresh',
          label: 'Refresh',
          onClick: vi.fn(),
        },
      ],
    });

    render(<ContextMenuManager />);

    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();

    // Hover over parent item to open submenu
    const viewItem = screen.getByText('View').closest('.os-context-item');
    fireEvent.mouseEnter(viewItem!);

    expect(screen.getByText('Large Icons')).toBeInTheDocument();

    // Click child
    fireEvent.click(screen.getByText('Large Icons'));
    expect(handleAction).toHaveBeenCalledTimes(1);
    expect(useContextMenuStore.getState().activeMenu).toBeNull();
  });
});
