import React from 'react';
import clsx from 'clsx';
import './Slider.css';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  iconLeft,
  iconRight,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className={clsx('os-slider-container', disabled && 'os-slider-container--disabled', className)}>
      {iconLeft && <span className="os-slider__icon-left">{iconLeft}</span>}
      <div className="os-slider-track-wrapper">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          className="os-slider-input"
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, var(--os-color-brand) ${percentage}%, var(--os-surface-hover) ${percentage}%)`,
          }}
        />
      </div>
      {iconRight && <span className="os-slider__icon-right">{iconRight}</span>}
    </div>
  );
};
