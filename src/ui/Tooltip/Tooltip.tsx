import { useState, useRef, type ReactNode } from 'react';
import clsx from 'clsx';
import './Tooltip.css';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
  className?: string;
}

export const Tooltip = ({
  content,
  children,
  position = 'top',
  delayMs = 300,
  className,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const hide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsVisible(false);
  };

  if (!content) return <>{children}</>;

  return (
    <div
      className={clsx('os-tooltip-wrapper', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={clsx('os-tooltip', `os-tooltip--${position}`)}
        >
          {content}
        </div>
      )}
    </div>
  );
};
