import type { DesktopIconItem } from '../../types/desktop';
import type { DesktopSortMode, DesktopSortOrder } from '../../stores/desktopStore';

export function sortDesktopIcons(
  icons: DesktopIconItem[],
  mode: DesktopSortMode,
  order: DesktopSortOrder = 'asc'
): DesktopIconItem[] {
  const sorted = [...icons].sort((a, b) => {
    let cmp = 0;
    if (mode === 'name') {
      cmp = a.title.localeCompare(b.title);
    } else if (mode === 'type') {
      cmp = (a.appId || 'file').localeCompare(b.appId || 'file');
    } else if (mode === 'date') {
      cmp = a.id.localeCompare(b.id);
    }
    return order === 'asc' ? cmp : -cmp;
  });
  return sorted;
}
