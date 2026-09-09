import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import './Input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  variant?: 'filled' | 'outline';
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      iconLeft,
      iconRight,
      variant = 'filled',
      inputSize = 'md',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={clsx(
          'os-input-wrapper',
          `os-input-wrapper--${variant}`,
          `os-input-wrapper--${inputSize}`,
          disabled && 'os-input-wrapper--disabled',
          className
        )}
      >
        {iconLeft && <span className="os-input__icon-left">{iconLeft}</span>}
        <input
          ref={ref}
          disabled={disabled}
          className="os-input"
          {...props}
        />
        {iconRight && <span className="os-input__icon-right">{iconRight}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
