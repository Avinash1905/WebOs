import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useOverlayStore } from '../../stores/overlayStore';
import './calendarPopover.css';

interface CalendarPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CalendarPopover = ({ isOpen, onClose }: CalendarPopoverProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const registerOverlay = useOverlayStore((state) => state.registerOverlay);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Overlay registration
  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerOverlay({
      id: 'calendar-popover',
      type: 'calendar',
      priority: 25,
      onDismiss: onClose,
    });
    return unregister;
  }, [isOpen, registerOverlay, onClose]);

  // Outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-testid="taskbar-clock"]')) return;
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const days: { day: number; isCurrentMonth: boolean }[] = [];

  // Previous month filler days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true });
  }

  // Next month filler days to complete 35 or 42 grid cells
  const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  return (
    <div
      ref={popoverRef}
      className="os-calendar-popover"
      role="dialog"
      aria-label="Interactive Calendar"
    >
      <div className="os-cal-header">
        <span className="os-cal-month-year">
          {MONTH_NAMES[month]} {year}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="os-cal-nav-btn" onClick={prevMonth} aria-label="Previous Month">
            <ChevronLeft size={16} />
          </button>
          <button className="os-cal-nav-btn" onClick={nextMonth} aria-label="Next Month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="os-cal-weekdays">
        {WEEKDAYS.map((wd) => (
          <div key={wd}>{wd}</div>
        ))}
      </div>

      <div className="os-cal-days-grid">
        {days.map((d, index) => {
          const isToday = isCurrentMonth && d.isCurrentMonth && d.day === today.getDate();
          const isSelected = d.isCurrentMonth && d.day === selectedDay;

          return (
            <div
              key={index}
              className={`os-cal-day ${!d.isCurrentMonth ? 'other-month' : ''} ${
                isToday ? 'today' : ''
              } ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                if (d.isCurrentMonth) setSelectedDay(d.day);
              }}
            >
              {d.day}
            </div>
          );
        })}
      </div>

      <div className="os-cal-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarIcon size={14} />
          <span>Today is {today.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};
