import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import './IconButton.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  'aria-label': string;
  variant?: 'ghost' | 'secondary' | 'danger' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      className,
      variant = 'ghost',
      size = 'md',
      active = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={clsx(
          'os-icon-button',
          `os-icon-button--${variant}`,
          `os-icon-button--${size}`,
          active && 'os-icon-button--active',
          className
        )}
        {...props}
      >
        <span className="os-icon-button__inner">{icon}</span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
