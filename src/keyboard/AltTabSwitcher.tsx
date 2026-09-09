import React from 'react';
import clsx from 'clsx';
import { useWindowStore } from '../stores/windowStore';
import './switcher.css';

export const AltTabSwitcher: React.FC = () => {
  const { isAltTabOpen, altTabIndex, windows, focusWindow, setAltTabOpen } = useWindowStore();

  const activeWindows = windows.filter((w) => w.state !== 'minimized');

  if (!isAltTabOpen || activeWindows.length === 0) {
    return null;
  }

  const renderAppIcon = (icon: unknown) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ElementType;
    return <IconComp size={32} />;
  };

  return (
    <div
      className="os-alt-tab-backdrop"
      data-testid="alt-tab-switcher"
      role="dialog"
      aria-label="Application Switcher"
    >
      <div className="os-alt-tab-modal">
        <div className="os-alt-tab-grid">
          {activeWindows.map((win, idx) => {
            const isSelected = idx === altTabIndex;
            return (
              <div
                key={win.id}
                className={clsx(
                  'os-alt-tab-item',
                  isSelected && 'os-alt-tab-item--selected'
                )}
                onClick={() => {
                  focusWindow(win.id);
                  setAltTabOpen(false);
                }}
              >
                <div
                  className="os-alt-tab-item__icon"
                  style={{ color: win.iconColor || 'inherit' }}
                >
                  {renderAppIcon(win.icon)}
                </div>
                <span className="os-alt-tab-item__title">{win.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
