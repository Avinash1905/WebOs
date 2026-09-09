import React from 'react';
import clsx from 'clsx';
import { StartButton } from './StartButton';
import { TaskbarAppArea } from './TaskbarAppArea';
import { SystemTray } from './SystemTray';
import { useUIStore } from '../../stores/uiStore';
import type { DesktopIconItem } from '../../types/desktop';
import './taskbar.css';

export interface TaskbarProps {
  onOpenApp: (item: DesktopIconItem) => void;
  className?: string;
}

export const Taskbar: React.FC<TaskbarProps> = ({ onOpenApp, className }) => {
  const { dockPosition } = useUIStore();

  return (
    <footer
      className={clsx(
        'os-taskbar',
        `os-taskbar--${dockPosition}`,
        className
      )}
      role="banner"
      aria-label="WebOS Taskbar"
      data-testid="taskbar"
    >
      <div className="os-taskbar__left">
        <StartButton />
      </div>

      <div className="os-taskbar__center">
        <TaskbarAppArea onOpenApp={onOpenApp} />
      </div>

      <div className="os-taskbar__right">
        <SystemTray />
      </div>
    </footer>
  );
};
