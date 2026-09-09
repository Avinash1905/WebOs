import React from 'react';
import clsx from 'clsx';
import './SegmentedControl.css';

export interface SegmentOption<T extends string = string> {
  value?: T;
  id?: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: SegmentedControlProps<T>) => {
  return (
    <div className={clsx('os-segmented-control', `os-segmented-control--${size}`, className)} role="tablist">
      {options.map((opt) => {
        const itemVal = (opt.value ?? opt.id) as T;
        const isSelected = itemVal === value;
        return (
          <button
            key={itemVal}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={clsx(
              'os-segmented-control__item',
              isSelected && 'os-segmented-control__item--selected'
            )}
            onClick={() => onChange(itemVal)}
          >
            {opt.icon && <span className="os-segmented-control__icon">{opt.icon}</span>}
            <span className="os-segmented-control__label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
