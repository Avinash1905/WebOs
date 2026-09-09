import { useState, useRef, useEffect, type ReactNode } from 'react';
import clsx from 'clsx';
import './Dropdown.css';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: (DropdownItem | 'separator')[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown = ({
  trigger,
  items,
  align = 'left',
  className,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={clsx('os-dropdown', className)} ref={dropdownRef}>
      <div
        className="os-dropdown__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={clsx('os-dropdown__menu', `os-dropdown__menu--align-${align}`)}
          role="menu"
        >
          {items.map((item, index) => {
            if (item === 'separator') {
              return <div key={`sep-${index}`} className="os-dropdown__separator" role="separator" />;
            }
            return (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                className={clsx(
                  'os-dropdown__item',
                  item.danger && 'os-dropdown__item--danger'
                )}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    setIsOpen(false);
                  }
                }}
              >
                {item.icon && <span className="os-dropdown__item-icon">{item.icon}</span>}
                <span className="os-dropdown__item-label">{item.label}</span>
                {item.shortcut && <span className="os-dropdown__item-shortcut">{item.shortcut}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
