import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useContextMenuStore } from '../stores/contextMenuStore';
import { useOverlayStore } from '../stores/overlayStore';
import type { ContextMenuItemOption, ContextMenuItemDef } from '../types/contextMenu';
import { ContextMenuItemComponent } from './ContextMenuItemComponent';
import './contextmenu.css';

export const ContextMenuManager = () => {
  const activeMenu = useContextMenuStore((state) => state.activeMenu);
  const closeContextMenu = useContextMenuStore((state) => state.closeContextMenu);
  const registerOverlay = useOverlayStore((state) => state.registerOverlay);

  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Register in overlay hierarchy (highest priority 100)
  useEffect(() => {
    if (!activeMenu) return;
    const unregister = registerOverlay({
      id: `context-menu-${activeMenu.id}`,
      type: 'context-menu',
      priority: 100, // Top priority: dismisses before all other overlays
      onDismiss: closeContextMenu,
    });
    return unregister;
  }, [activeMenu, registerOverlay, closeContextMenu]);

  // Adjust coordinates so it never overflows the viewport
  useLayoutEffect(() => {
    if (!activeMenu || !menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let posX = activeMenu.x;
    let posY = activeMenu.y;

    if (posX + menuRect.width > viewportWidth - 8) {
      posX = Math.max(8, viewportWidth - menuRect.width - 8);
    }
    if (posY + menuRect.height > viewportHeight - 8) {
      posY = Math.max(8, viewportHeight - menuRect.height - 8);
    }

    setAdjustedPos({ x: posX, y: posY });
  }, [activeMenu]);

  // Close on outside click
  useEffect(() => {
    if (!activeMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [activeMenu, closeContextMenu]);

  if (!activeMenu) return null;

  const handleItemClick = (item: ContextMenuItemOption) => {
    closeContextMenu();
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <div
      ref={menuRef}
      className="os-nested-context-menu"
      style={{
        left: `${adjustedPos.x}px`,
        top: `${adjustedPos.y}px`,
      }}
      role="menu"
    >
      {activeMenu.items.map((item: ContextMenuItemDef, index: number) => {
        if (item === 'separator') {
          return <div key={`sep-${index}`} className="os-context-separator" />;
        }
        return (
          <ContextMenuItemComponent
            key={item.id}
            item={item}
            onItemClick={handleItemClick}
          />
        );
      })}
    </div>
  );
};
