/**
 * @file SearchSort.ts
 * @description Sorter for search result items.
 */

import type { SearchResultItem, SearchSortBy, SearchSortOrder } from './types.js';

export class SearchSort {
  public static sort(
    items: SearchResultItem[],
    sortBy: SearchSortBy = 'relevance',
    sortOrder?: SearchSortOrder
  ): SearchResultItem[] {
    const order = sortOrder ?? (sortBy === 'relevance' ? 'desc' : 'asc');
    const factor = order === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return (a.score - b.score) * factor;
        case 'name':
          return a.name.localeCompare(b.name) * factor;
        case 'path':
          return a.path.localeCompare(b.path) * factor;
        case 'size':
          return (a.size - b.size) * factor;
        case 'modified':
          return (a.updatedAt - b.updatedAt) * factor;
        default:
          return (a.score - b.score) * factor;
      }
    });
  }
}
