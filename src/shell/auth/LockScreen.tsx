import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Lock, ArrowRight, Wifi, Battery, Bell } from 'lucide-react';
import './lock.css';

export const LockScreen: React.FC = () => {
  const { currentSession, unlockScreen } = useAuthStore();
  const [password, setPassword] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const ok = await unlockScreen(password || 'admin123');
    if (!ok) {
      setErrorMsg('Incorrect password (default: admin123 / developer123)');
    }
  };

  return (
    <div className="lock-screen-container">
      {/* Top Status Bar */}
      <div className="lock-top-bar">
        <div className="lock-brand">WebOS 2.0</div>
        <div className="lock-indicators">
          <Wifi size={15} />
          <Bell size={15} />
          <Battery size={16} />
        </div>
      </div>

      {/* Center Clock & Date */}
      <div className="lock-center-content">
        <div className="lock-time-display">{timeStr}</div>
        <div className="lock-date-display">{dateStr}</div>

        <div className="lock-user-card">
          <div className="lock-user-name">
            {currentSession?.user.username || 'System User'}
          </div>

          <form className="lock-unlock-form" onSubmit={handleUnlock}>
            <div className="lock-input-wrap">
              <Lock size={15} className="lock-icon" />
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="lock-password-input"
              />
              <button type="submit" className="lock-submit-btn">
                <ArrowRight size={15} />
              </button>
            </div>
            {errorMsg && <div className="lock-error-text">{errorMsg}</div>}
          </form>
        </div>
      </div>

      <div className="lock-bottom-hint">
        Press Enter or provide credentials to resume session
      </div>
    </div>
  );
};
