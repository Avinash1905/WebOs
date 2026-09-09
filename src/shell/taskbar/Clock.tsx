import React, { useState, useEffect } from 'react';
import { Tooltip } from '../../ui/Tooltip/Tooltip';

export interface ClockProps {
  showSeconds?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Clock: React.FC<ClockProps> = ({ showSeconds = false, className, onClick }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
  });

  const dateString = time.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  const fullDateTooltip = time.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Tooltip content={fullDateTooltip} position="top">
      <div
        className={`os-clock ${className || ''}`}
        role="button"
        tabIndex={0}
        aria-label={`Current time: ${timeString}, ${dateString}`}
        data-testid="taskbar-clock"
        onClick={onClick}
      >
        <span className="os-clock__time">{timeString}</span>
        <span className="os-clock__date">{dateString}</span>
      </div>
    </Tooltip>
  );
};
