import React, { useState, useEffect } from 'react';
import { Tooltip } from '../../ui/Tooltip/Tooltip';
import { useTaskbarCustomStore } from '../../stores/taskbarCustomStore';

export interface ClockProps {
  className?: string;
  onClick?: () => void;
}

export const Clock: React.FC<ClockProps> = ({ className, onClick }) => {
  const clock24Hour = useTaskbarCustomStore((state) => state.clock24Hour);
  const showSeconds = useTaskbarCustomStore((state) => state.showSeconds);
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
    hour12: !clock24Hour,
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
