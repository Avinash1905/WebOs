import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import './Panel.css';

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'glass' | 'solid' | 'elevated';
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      children,
      className,
      variant = 'glass',
      radius = 'md',
      elevation = 'md',
      bordered = true,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'os-panel',
          `os-panel--${variant}`,
          `os-panel--radius-${radius}`,
          `os-panel--elevation-${elevation}`,
          bordered && 'os-panel--bordered',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';
