import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Trash2 } from 'lucide-react';
import './calendar.css';

interface CalendarEvent {
  id: string;
  title: string;
  dateStr: string;
  timeStr: string;
  category: 'work' | 'personal' | 'important';
}

export const CalendarApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: 'WebOS Core Release Sync', dateStr: '2026-09-09', timeStr: '10:00 AM', category: 'important' },
    { id: '2', title: 'Review Virtual Filesystem Architecture', dateStr: '2026-09-09', timeStr: '02:30 PM', category: 'work' },
    { id: '3', title: 'PostgreSQL Database Migrations Review', dateStr: '2026-09-10', timeStr: '11:00 AM', category: 'work' },
  ]);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('12:00 PM');
  const [newEventCategory, setNewEventCategory] = useState<'work' | 'personal' | 'important'>('work');
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const dayEvents = events.filter((e) => e.dateStr === selectedDateStr);

  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return;
    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: newEventTitle.trim(),
      dateStr: selectedDateStr,
      timeStr: newEventTime,
      category: newEventCategory,
    };
    setEvents([...events, newEv]);
    setNewEventTitle('');
    setIsAddingEvent(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  return (
    <div className="calendar-app-container">
      {/* Calendar Grid View */}
      <div className="calendar-main-view">
        {/* Month Header Navigation */}
        <div className="calendar-month-header">
          <div className="month-label">
            <CalendarIcon size={18} className="text-pink" />
            <span>{monthNames[month]} {year}</span>
          </div>
          <div className="month-nav-btns">
            <button className="cal-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
            <button className="cal-nav-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
            <button className="cal-nav-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="weekdays-row">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="weekday-col">{d}</div>
          ))}
        </div>

        {/* Month Calendar Cells */}
        <div className="days-grid">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="day-cell empty" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isSelected = selectedDay === dayNum;
            const isToday =
              dayNum === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const count = events.filter((e) => e.dateStr === dateStr).length;

            return (
              <div
                key={dayNum}
                className={`day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => setSelectedDay(dayNum)}
              >
                <div className="day-number">{dayNum}</div>
                {count > 0 && <div className="event-dot-indicator">{count}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Events Schedule Sidebar */}
      <div className="calendar-schedule-sidebar">
        <div className="sidebar-header">
          <div>
            <div className="sidebar-date-heading">{monthNames[month]} {selectedDay}, {year}</div>
            <div className="sidebar-date-sub">{dayEvents.length} events scheduled</div>
          </div>
          <button className="add-event-btn" onClick={() => setIsAddingEvent(true)}>
            <Plus size={15} />
          </button>
        </div>

        {isAddingEvent && (
          <div className="add-event-card">
            <input
              type="text"
              placeholder="Event title..."
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              className="event-input"
              autoFocus
            />
            <div className="add-event-row">
              <input
                type="text"
                placeholder="Time (e.g. 10:00 AM)"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                className="event-input-time"
              />
              <select
                value={newEventCategory}
                onChange={(e) => setNewEventCategory(e.target.value as any)}
                className="event-select"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="important">Important</option>
              </select>
            </div>
            <div className="add-event-actions">
              <button className="event-btn secondary" onClick={() => setIsAddingEvent(false)}>Cancel</button>
              <button className="event-btn primary" onClick={handleAddEvent}>Save Event</button>
            </div>
          </div>
        )}

        <div className="events-list">
          {dayEvents.length === 0 ? (
            <div className="no-events">No events scheduled for this day.</div>
          ) : (
            dayEvents.map((ev) => (
              <div key={ev.id} className={`event-card ${ev.category}`}>
                <div className="event-card-main">
                  <div className="event-title">{ev.title}</div>
                  <div className="event-time"><Clock size={11} /> {ev.timeStr}</div>
                </div>
                <button className="del-event-btn" onClick={() => handleDeleteEvent(ev.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
