import { appRegistry } from '../../contracts/appRegistry';
import { useWindowStore } from '../../stores/windowStore';
import type { ISearchProvider, SearchResultItem } from '../../types/search';

export class ApplicationSearchProvider implements ISearchProvider {
  id = 'application-provider';
  name = 'Applications';
  category: 'Applications' = 'Applications';
  priority = 100;

  search(query: string): SearchResultItem[] {
    const q = query.trim().toLowerCase();
    const apps = appRegistry.getAllApplications();

    if (!q) {
      // Return top apps as suggestions
      return apps.slice(0, 5).map((app) => ({
        id: `app-${app.id}`,
        title: app.name,
        subtitle: app.description || `${app.category} App`,
        category: 'Applications',
        icon: app.icon,
        iconColor: app.iconColor,
        score: app.isFavorite ? 10 : 5,
        keywords: app.keywords,
        action: () => {
          useWindowStore.getState().openWindow({
            id: `win-${app.id}`,
            appId: app.id,
            title: app.name,
            icon: app.icon,
            bounds: app.defaultBounds,
          });
        },
      }));
    }

    const matches: SearchResultItem[] = [];

    for (const app of apps) {
      let score = 0;
      const nameLower = app.name.toLowerCase();
      if (nameLower === q) {
        score = 100;
      } else if (nameLower.startsWith(q)) {
        score = 80;
      } else if (nameLower.includes(q)) {
        score = 60;
      } else if (app.keywords?.some((k) => k.toLowerCase().includes(q))) {
        score = 40;
      } else if (app.description?.toLowerCase().includes(q)) {
        score = 20;
      }

      if (score > 0) {
        matches.push({
          id: `app-${app.id}`,
          title: app.name,
          subtitle: app.description || `${app.category} Application`,
          category: 'Applications',
          icon: app.icon,
          iconColor: app.iconColor,
          score,
          keywords: app.keywords,
          action: () => {
            useWindowStore.getState().openWindow({
              id: `win-${app.id}`,
              appId: app.id,
              title: app.name,
              icon: app.icon,
              bounds: app.defaultBounds,
            });
          },
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }
}
