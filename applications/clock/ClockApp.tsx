import React, { useState, useEffect } from 'react';
import { Timer, Hourglass, Globe } from 'lucide-react';
import './clock.css';

export const ClockApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [tab, setTab] = useState<'world' | 'stopwatch' | 'timer'>('world');
  const [now, setNow] = useState(new Date());
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [isSwRunning, setIsSwRunning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isSwRunning) {
      interval = setInterval(() => setStopwatchMs((m) => m + 10), 10);
    }
    return () => clearInterval(interval);
  }, [isSwRunning]);

  const worldCities = [
    { city: 'San Francisco', tz: 'America/Los_Angeles' },
    { city: 'New York', tz: 'America/New_York' },
    { city: 'London', tz: 'Europe/London' },
    { city: 'Tokyo', tz: 'Asia/Tokyo' },
    { city: 'Sydney', tz: 'Australia/Sydney' },
  ];

  return (
    <div className="clock-app-container">
      <div className="clock-nav-tabs">
        <button className={`clock-tab ${tab === 'world' ? 'active' : ''}`} onClick={() => setTab('world')}>
          <Globe size={14} />
          <span>World Clock</span>
        </button>
        <button className={`clock-tab ${tab === 'stopwatch' ? 'active' : ''}`} onClick={() => setTab('stopwatch')}>
          <Timer size={14} />
          <span>Stopwatch</span>
        </button>
        <button className={`clock-tab ${tab === 'timer' ? 'active' : ''}`} onClick={() => setTab('timer')}>
          <Hourglass size={14} />
          <span>Timer</span>
        </button>
      </div>

      <div className="clock-content-area">
        {tab === 'world' && (
          <div className="world-clock-grid">
            {worldCities.map((c) => {
              const timeStr = now.toLocaleTimeString('en-US', { timeZone: c.tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
              return (
                <div key={c.city} className="city-clock-card">
                  <span className="city-name">{c.city}</span>
                  <span className="city-time">{timeStr}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'stopwatch' && (
          <div className="stopwatch-view">
            <div className="sw-display">{(stopwatchMs / 1000).toFixed(2)}s</div>
            <div className="sw-controls">
              <button className="sw-btn" onClick={() => setIsSwRunning(!isSwRunning)}>
                {isSwRunning ? 'Stop' : 'Start'}
              </button>
              <button className="sw-btn reset" onClick={() => { setIsSwRunning(false); setStopwatchMs(0); }}>
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
