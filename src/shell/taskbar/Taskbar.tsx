import React, { useState } from 'react';
import clsx from 'clsx';
import { Rocket } from 'lucide-react';
import { StartButton } from './StartButton';
import { TaskbarAppArea } from './TaskbarAppArea';
import { SystemTray } from './SystemTray';
import { Tooltip } from '../../ui/Tooltip/Tooltip';
import { useTaskbarCustomStore } from '../../stores/taskbarCustomStore';
import { useLauncherStore } from '../../stores/launcherStore';
import type { DesktopIconItem } from '../../types/desktop';
import './taskbar.css';

export interface TaskbarProps {
  onOpenApp: (item: DesktopIconItem) => void;
  className?: string;
}

export const Taskbar: React.FC<TaskbarProps> = ({ onOpenApp, className }) => {
  const { position, alignment, autoHide } = useTaskbarCustomStore();
  const { toggleLauncher, isOpen: isLauncherOpen } = useLauncherStore();
  const [isHovered, setIsHovered] = useState(false);

  const isHidden = autoHide && !isHovered;

  return (
    <footer
      className={clsx(
        'os-taskbar',
        `os-taskbar--${position}`,
        `os-taskbar-align--${alignment}`,
        autoHide && 'os-taskbar--autohide',
        isHidden && 'os-taskbar--hidden',
        className
      )}
      role="banner"
      aria-label="WebOS Taskbar"
      data-testid="taskbar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="os-taskbar__left">
        <StartButton />

        <Tooltip content="Open Launchpad (All Applications)" position="top">
          <button
            type="button"
            aria-label="Application Launcher"
            aria-expanded={isLauncherOpen}
            data-testid="taskbar-launcher-btn"
            className={clsx(
              'os-taskbar-launcher-btn',
              isLauncherOpen && 'os-taskbar-launcher-btn--active'
            )}
            onClick={toggleLauncher}
          >
            <Rocket size={18} />
          </button>
        </Tooltip>
      </div>

      <div
        className="os-taskbar__center"
        style={{
          justifyContent: alignment === 'left' ? 'flex-start' : 'center',
        }}
      >
        <TaskbarAppArea onOpenApp={onOpenApp} />
      </div>

      <div className="os-taskbar__right">
        <SystemTray />
      </div>
    </footer>
  );
};
