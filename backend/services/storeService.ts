/**
 * WebOS Backend - App Store Catalog & Ratings Service
 */

export interface StoreAppItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  downloadsCount: number;
  price: number;
  description: string;
  iconName: string;
  bannerUrl: string;
  author: string;
  version: string;
  reviewsCount: number;
}

export class AppStoreService {
  private static instance: AppStoreService;
  private catalog: Map<string, StoreAppItem> = new Map();

  private constructor() {
    this.seedCatalog();
  }

  public static getInstance(): AppStoreService {
    if (!AppStoreService.instance) {
      AppStoreService.instance = new AppStoreService();
    }
    return AppStoreService.instance;
  }

  private seedCatalog(): void {
    const apps: StoreAppItem[] = [
      {
        id: 'app-paint-pro',
        name: 'Paint Studio Pro',
        category: 'Creative',
        rating: 4.8,
        downloadsCount: 14200,
        price: 0,
        description: 'Advanced raster graphics studio with layered drawing, canvas transformations, and brush engines.',
        iconName: 'PenTool',
        bannerUrl: '/assets/banners/paint.png',
        author: 'WebOS Creative Labs',
        version: '2.0.1',
        reviewsCount: 382,
      },
      {
        id: 'app-pdf-reader',
        name: 'Document & PDF Viewer',
        category: 'Productivity',
        rating: 4.9,
        downloadsCount: 29500,
        price: 0,
        description: 'Ultra-fast PDF and rich document inspector with full-text search, highlights, and annotations.',
        iconName: 'FileText',
        bannerUrl: '/assets/banners/pdf.png',
        author: 'Adobe Open Source',
        version: '3.1.0',
        reviewsCount: 890,
      },
      {
        id: 'app-arcade-retro',
        name: 'WebOS Game Center',
        category: 'Games',
        rating: 4.7,
        downloadsCount: 45000,
        price: 0,
        description: 'Classic gaming suite featuring Minesweeper, Solitaire, Snake, and 2048 with leaderboards.',
        iconName: 'Gamepad2',
        bannerUrl: '/assets/banners/arcade.png',
        author: 'RetroByte Studio',
        version: '1.5.0',
        reviewsCount: 1204,
      },
      {
        id: 'app-video-suite',
        name: 'Cinema Video Player',
        category: 'Media',
        rating: 4.6,
        downloadsCount: 18900,
        price: 0,
        description: 'Hardware-accelerated media player supporting 4K video, subtitle parsing, and playlist queueing.',
        iconName: 'Film',
        bannerUrl: '/assets/banners/video.png',
        author: 'VLC Community',
        version: '2.4.0',
        reviewsCount: 450,
      },
    ];

    for (const app of apps) {
      this.catalog.set(app.id, app);
    }
  }

  public getCatalog(category?: string): StoreAppItem[] {
    const list = Array.from(this.catalog.values());
    if (category && category !== 'All') {
      return list.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }
    return list;
  }

  public getApp(id: string): StoreAppItem | undefined {
    return this.catalog.get(id);
  }

  public recordDownload(id: string): void {
    const app = this.catalog.get(id);
    if (app) {
      app.downloadsCount++;
    }
  }
}

export const storeService = AppStoreService.getInstance();
