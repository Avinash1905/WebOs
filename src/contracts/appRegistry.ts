import type { LucideIcon } from 'lucide-react';
import type { WindowBounds } from '../types/window';

/**
 * Member 3 Integration Boundary: Application Registry & Manifest
 * 
 * Member 3 (Applications) registers apps using this contract.
 * Member 1 uses this registry to render icons, launch windows, and manage titlebars.
 */

export interface AppDefinition {
  id: string;
  name: string;
  category: 'System' | 'Utilities' | 'Productivity' | 'Entertainment' | 'Development';
  icon: LucideIcon | string;
  iconColor?: string;
  description?: string;
  version: string;
  defaultBounds?: Partial<WindowBounds>;
  minWidth?: number;
  minHeight?: number;
  canMaximize?: boolean;
  canMinimize?: boolean;
  canClose?: boolean;
  singleInstance?: boolean;
  isPinnedToTaskbar?: boolean;
  showOnDesktop?: boolean;
  component?: React.ComponentType<{ windowId: string; appId: string }>;
}

export interface IAppRegistry {
  registerApplication(app: AppDefinition): void;
  unregisterApplication(appId: string): void;
  getApplication(appId: string): AppDefinition | undefined;
  getAllApplications(): AppDefinition[];
  getDesktopApplications(): AppDefinition[];
  getPinnedApplications(): AppDefinition[];
}

class AppRegistryImpl implements IAppRegistry {
  private apps = new Map<string, AppDefinition>();

  registerApplication(app: AppDefinition): void {
    this.apps.set(app.id, app);
  }

  unregisterApplication(appId: string): void {
    this.apps.delete(appId);
  }

  getApplication(appId: string): AppDefinition | undefined {
    return this.apps.get(appId);
  }

  getAllApplications(): AppDefinition[] {
    return Array.from(this.apps.values());
  }

  getDesktopApplications(): AppDefinition[] {
    return this.getAllApplications().filter(a => a.showOnDesktop !== false);
  }

  getPinnedApplications(): AppDefinition[] {
    return this.getAllApplications().filter(a => a.isPinnedToTaskbar);
  }
}

export const appRegistry: IAppRegistry = new AppRegistryImpl();
