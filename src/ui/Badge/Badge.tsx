import type { ReactNode } from 'react';
import clsx from 'clsx';
import './Badge.css';

export interface BadgeProps {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'dot';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
}: BadgeProps) => {
  return (
    <span
      className={clsx(
        'os-badge',
        `os-badge--${variant}`,
        `os-badge--${size}`,
        variant === 'dot' && 'os-badge--dot-only',
        className
      )}
    >
      {variant !== 'dot' && children}
    </span>
  );
};
