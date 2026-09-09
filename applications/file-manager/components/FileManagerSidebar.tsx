/**
 * @file FileManagerSidebar.tsx
 * @description Sidebar component for quick navigation targets, system locations, and persistent favorites.
 */

import React from 'react';
import {
  Folder,
  Home,
  FileText,
  Download,
  Image,
  Trash2,
  Star,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import { useFileManagerStore } from '../store/fileManagerStore.js';

interface QuickLink {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const QUICK_LINKS: QuickLink[] = [
  { name: 'Home', path: '/home/user', icon: <Home size={16} /> },
  { name: 'Documents', path: '/home/user/Documents', icon: <FileText size={16} /> },
  { name: 'Downloads', path: '/home/user/Downloads', icon: <Download size={16} /> },
  { name: 'Pictures', path: '/home/user/Pictures', icon: <Image size={16} /> },
  { name: 'Trash', path: '/trash', icon: <Trash2 size={16} /> },
];

export const FileManagerSidebar: React.FC = () => {
  const { currentPath, favorites, navigateTo, removeFavorite, addFavorite } = useFileManagerStore();

  return (
    <aside className="fm-sidebar">
      {/* Quick Access Locations */}
      <div className="fm-sidebar-section">
        <div className="fm-sidebar-header">
          <span>Quick Access</span>
        </div>
        <nav className="fm-sidebar-nav">
          {QUICK_LINKS.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                className={`fm-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => navigateTo(link.path)}
              >
                <span className="fm-sidebar-icon">{link.icon}</span>
                <span className="fm-sidebar-label">{link.name}</span>
                {isActive && <ChevronRight size={14} className="fm-sidebar-active-arrow" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Favorites Section */}
      <div className="fm-sidebar-section">
        <div className="fm-sidebar-header">
          <span>Favorites</span>
          <button
            className="fm-sidebar-header-btn"
            title="Pin Current Directory to Favorites"
            onClick={() => addFavorite(currentPath)}
          >
            <Plus size={14} />
          </button>
        </div>
        <nav className="fm-sidebar-nav">
          {favorites.length === 0 ? (
            <div className="fm-sidebar-empty">No favorite folders</div>
          ) : (
            favorites.map((favPath) => {
              const name = favPath.split('/').pop() || favPath;
              const isActive = currentPath === favPath;
              return (
                <div
                  key={favPath}
                  className={`fm-sidebar-item-wrap ${isActive ? 'active' : ''}`}
                >
                  <button
                    className="fm-sidebar-item"
                    onClick={() => navigateTo(favPath)}
                  >
                    <span className="fm-sidebar-icon">
                      <Star size={14} className="fm-star-icon" />
                    </span>
                    <span className="fm-sidebar-label" title={favPath}>
                      {name}
                    </span>
                  </button>
                  <button
                    className="fm-sidebar-remove-fav"
                    title="Remove from Favorites"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(favPath);
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })
          )}
        </nav>
      </div>
    </aside>
  );
};
