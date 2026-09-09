import React from 'react';
import { Lock, LogOut, RotateCcw, Power } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip/Tooltip';

export interface StartMenuFooterProps {
  onLock?: () => void;
  onSignOut?: () => void;
  onRestart?: () => void;
  onShutdown?: () => void;
}

export const StartMenuFooter: React.FC<StartMenuFooterProps> = ({
  onLock,
  onSignOut,
  onRestart,
  onShutdown,
}) => {
  return (
    <div className="os-start-menu__footer">
      <div className="os-start-menu__footer-status">
        <span className="os-start-menu__system-version">WebOS v2.0 Enterprise</span>
      </div>

      <div className="os-start-menu__power-controls">
        <Tooltip content="Lock Screen" position="top">
          <button
            type="button"
            aria-label="Lock Screen"
            className="os-start-menu__power-btn"
            onClick={onLock}
          >
            <Lock size={15} />
          </button>
        </Tooltip>

        <Tooltip content="Sign Out" position="top">
          <button
            type="button"
            aria-label="Sign Out"
            className="os-start-menu__power-btn"
            onClick={onSignOut}
          >
            <LogOut size={15} />
          </button>
        </Tooltip>

        <Tooltip content="Restart WebOS" position="top">
          <button
            type="button"
            aria-label="Restart"
            className="os-start-menu__power-btn"
            onClick={onRestart}
          >
            <RotateCcw size={15} />
          </button>
        </Tooltip>

        <Tooltip content="Shut Down" position="top">
          <button
            type="button"
            aria-label="Shut Down"
            className="os-start-menu__power-btn os-start-menu__power-btn--danger"
            onClick={onShutdown}
          >
            <Power size={15} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
