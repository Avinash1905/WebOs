import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';
import './Popover.css';

export interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  className?: string;
  'aria-label'?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  isOpen,
  onClose,
  children,
  position = 'top-right',
  className,
  'aria-label': ariaLabel = 'Popover Panel',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={ariaLabel}
      className={clsx('os-popover', `os-popover--${position}`, className)}
    >
      {children}
    </div>
  );
};
