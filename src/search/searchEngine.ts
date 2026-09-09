import type { ISearchProvider, SearchResultItem } from '../types/search';
import { ApplicationSearchProvider } from './providers/ApplicationSearchProvider';
import { SettingsSearchProvider } from './providers/SettingsSearchProvider';
import { CommandSearchProvider } from './providers/CommandSearchProvider';
import { RecentSearchProvider } from './providers/RecentSearchProvider';

class SearchEngine {
  private providers: ISearchProvider[] = [];

  constructor() {
    this.registerProvider(new RecentSearchProvider());
    this.registerProvider(new ApplicationSearchProvider());
    this.registerProvider(new SettingsSearchProvider());
    this.registerProvider(new CommandSearchProvider());
  }

  registerProvider(provider: ISearchProvider): void {
    this.providers.push(provider);
    this.providers.sort((a, b) => b.priority - a.priority);
  }

  unregisterProvider(providerId: string): void {
    this.providers = this.providers.filter((p) => p.id !== providerId);
  }

  async search(query: string, categoryFilter: string = 'All'): Promise<SearchResultItem[]> {
    const results: SearchResultItem[] = [];

    for (const provider of this.providers) {
      if (categoryFilter !== 'All' && provider.category !== categoryFilter) {
        continue;
      }
      try {
        const providerResults = await provider.search(query);
        results.push(...providerResults);
      } catch (err) {
        console.error(`Search error in provider ${provider.name}:`, err);
      }
    }

    // Sort by relevance score descending
    return results.sort((a, b) => b.score - a.score);
  }
}

export const searchEngine = new SearchEngine();
