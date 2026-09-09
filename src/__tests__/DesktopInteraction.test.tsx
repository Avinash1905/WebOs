import { describe, it, expect, beforeEach } from 'vitest';
import { useDesktopStore } from '../stores/desktopStore';
import { sortDesktopIcons } from '../shell/desktop/desktopSorting';
import type { DesktopIconItem } from '../types/desktop';

const sampleIcons: DesktopIconItem[] = [
  { id: '1', title: 'Zebra File', appId: 'editor' },
  { id: '2', title: 'Apple Doc', appId: 'documents' },
  { id: '3', title: 'Banana Code', appId: 'terminal' },
];

describe('Desktop Interaction & Sorting', () => {
  beforeEach(() => {
    useDesktopStore.setState({
      icons: sampleIcons,
      selectedIconIds: [],
      focusedIconId: null,
      sortMode: 'name',
      sortOrder: 'asc',
      autoArrange: true,
      selectionBox: null,
      contextMenu: null,
    });
  });

  it('sorts icons by name ascending and descending', () => {
    const asc = sortDesktopIcons(sampleIcons, 'name', 'asc');
    expect(asc[0].title).toBe('Apple Doc');
    expect(asc[2].title).toBe('Zebra File');

    const desc = sortDesktopIcons(sampleIcons, 'name', 'desc');
    expect(desc[0].title).toBe('Zebra File');
    expect(desc[2].title).toBe('Apple Doc');
  });

  it('updates desktop store multi-selection', () => {
    const store = useDesktopStore.getState();

    store.selectIcon('1', false);
    expect(useDesktopStore.getState().selectedIconIds).toEqual(['1']);

    store.selectIcon('2', true);
    expect(useDesktopStore.getState().selectedIconIds).toEqual(['1', '2']);

    store.setSelectedIcons(['1', '2', '3']);
    expect(useDesktopStore.getState().selectedIconIds.length).toBe(3);

    store.clearSelection();
    expect(useDesktopStore.getState().selectedIconIds.length).toBe(0);
  });
});
