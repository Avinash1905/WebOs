import { History } from 'lucide-react';
import { useSearchStore } from '../../stores/searchStore';
import type { ISearchProvider, SearchResultItem } from '../../types/search';

export class RecentSearchProvider implements ISearchProvider {
  id = 'recent-provider';
  name = 'Recent';
  category: 'Recent' = 'Recent';
  priority = 110;

  search(query: string): SearchResultItem[] {
    const q = query.trim().toLowerCase();
    const recentQueries = useSearchStore.getState().recentQueries;

    if (!q) {
      return recentQueries.map((rq, idx) => ({
        id: `recent-${idx}`,
        title: rq,
        subtitle: 'Recent Search',
        category: 'Recent',
        icon: History,
        iconColor: '#94a3b8',
        score: 50 - idx,
        action: () => {
          useSearchStore.getState().setQuery(rq);
        },
      }));
    }

    const matches = recentQueries.filter((rq) => rq.toLowerCase().includes(q));
    return matches.map((rq, idx) => ({
      id: `recent-${idx}`,
      title: rq,
      subtitle: 'Recent Search',
      category: 'Recent',
      icon: History,
      iconColor: '#94a3b8',
      score: 35 - idx,
      action: () => {
        useSearchStore.getState().setQuery(rq);
      },
    }));
  }
}
