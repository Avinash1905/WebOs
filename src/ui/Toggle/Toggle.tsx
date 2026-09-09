import React from 'react';
import clsx from 'clsx';
import './Toggle.css';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className,
}) => {
  return (
    <label
      className={clsx(
        'os-toggle-wrapper',
        `os-toggle-wrapper--${size}`,
        disabled && 'os-toggle-wrapper--disabled',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={clsx('os-toggle', checked && 'os-toggle--checked')}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className="os-toggle__thumb" />
      </button>
      {label && <span className="os-toggle__label">{label}</span>}
    </label>
  );
};
