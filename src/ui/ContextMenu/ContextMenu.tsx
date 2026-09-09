import { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';
import './ContextMenu.css';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: (ContextMenuItem | 'separator')[];
  onClose: () => void;
  className?: string;
}

export const ContextMenu = ({
  x,
  y,
  items,
  onClose,
  className,
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates so context menu doesn't overflow screen
  const adjustedX = typeof window !== 'undefined' ? Math.min(x, window.innerWidth - 220) : x;
  const adjustedY = typeof window !== 'undefined' ? Math.min(y, window.innerHeight - 300) : y;

  return (
    <div
      ref={menuRef}
      role="menu"
      className={clsx('os-context-menu', className)}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
    >
      {items.map((item, index) => {
        if (item === 'separator') {
          return <div key={`ctx-sep-${index}`} className="os-context-menu__separator" role="separator" />;
        }
        return (
          <button
            key={item.id}
            role="menuitem"
            disabled={item.disabled}
            className={clsx(
              'os-context-menu__item',
              item.danger && 'os-context-menu__item--danger'
            )}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
          >
            {item.icon && <span className="os-context-menu__item-icon">{item.icon}</span>}
            <span className="os-context-menu__item-label">{item.label}</span>
            {item.shortcut && (
              <span className="os-context-menu__item-shortcut">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
