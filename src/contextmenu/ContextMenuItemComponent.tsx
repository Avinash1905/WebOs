import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import type { ContextMenuItemOption, ContextMenuItemDef } from '../types/contextMenu';
import { renderOSIcon } from '../utils/iconUtils';

interface ContextMenuItemProps {
  item: ContextMenuItemOption;
  onItemClick: (item: ContextMenuItemOption) => void;
}

export const ContextMenuItemComponent = ({ item, onItemClick }: ContextMenuItemProps) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const [submenuPosition, setSubmenuPosition] = useState<'right' | 'left'>('right');

  const hasChildren = Boolean(item.children && item.children.length > 0);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (hasChildren) {
      // Check viewport bounds for submenu
      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        if (rect.right + 200 > window.innerWidth) {
          setSubmenuPosition('left');
        } else {
          setSubmenuPosition('right');
        }
      }
      setIsSubmenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsSubmenuOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.disabled) return;
    if (hasChildren) return;
    onItemClick(item);
  };

  return (
    <div
      ref={itemRef}
      className={`os-context-item ${item.disabled ? 'disabled' : ''} ${item.danger ? 'danger' : ''} ${
        isSubmenuOpen ? 'has-submenu-open' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="menuitem"
      aria-haspopup={hasChildren}
      aria-expanded={isSubmenuOpen}
    >
      <div className="os-context-item-icon">
        {item.checked ? (
          <Check size={14} />
        ) : item.icon ? (
          renderOSIcon(item.icon, { size: 14 })
        ) : null}
      </div>

      <span className="os-context-item-label">{item.label}</span>

      {item.shortcut && (
        <span className="os-context-item-shortcut">{item.shortcut}</span>
      )}

      {hasChildren && (
        <ChevronRight size={14} className="os-context-item-arrow" />
      )}

      {hasChildren && isSubmenuOpen && (
        <div
          className="os-context-submenu"
          style={
            submenuPosition === 'left'
              ? { right: '100%', left: 'auto', marginRight: 4 }
              : { left: '100%', right: 'auto', marginLeft: 4 }
          }
          role="menu"
        >
          {item.children?.map((child: ContextMenuItemDef, index: number) => {
            if (child === 'separator') {
              return <div key={`sep-${index}`} className="os-context-separator" />;
            }
            return (
              <ContextMenuItemComponent
                key={child.id}
                item={child}
                onItemClick={onItemClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
