import React, { forwardRef } from 'react';
import clsx from 'clsx';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'secondary',
      size = 'md',
      iconLeft,
      iconRight,
      isLoading,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        className={clsx(
          'os-button',
          `os-button--${variant}`,
          `os-button--${size}`,
          isLoading && 'os-button--loading',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="os-button__spinner" aria-hidden="true" />
        ) : (
          iconLeft && <span className="os-button__icon-left">{iconLeft}</span>
        )}
        <span className="os-button__text">{children}</span>
        {!isLoading && iconRight && <span className="os-button__icon-right">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
