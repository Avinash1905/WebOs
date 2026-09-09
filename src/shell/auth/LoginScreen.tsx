import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import './login.css';

export const LoginScreen: React.FC = () => {
  const { availableUsers, login } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState(availableUsers[0]);
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const success = await login(selectedUser.username, password);
    setIsLoading(false);
    if (!success) {
      setErrorMsg('Invalid password. Default credentials: admin123 or developer123');
    }
  };

  return (
    <div className="login-screen-container">
      <div className="login-backdrop-blur" />

      <div className="login-card">
        <div className="login-header">
          <div className="login-avatar-ring">
            <User size={38} className="text-cyan-400" />
          </div>
          <h2 className="login-user-name">{selectedUser.displayName}</h2>
          <div className="login-user-role"><ShieldCheck size={12} /> {selectedUser.role.toUpperCase()}</div>
        </div>

        {/* User Selection Pills */}
        <div className="user-selection-pills">
          {availableUsers.map((u) => (
            <button
              key={u.id}
              className={`user-pill ${u.id === selectedUser.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedUser(u);
                setPassword(u.username === 'admin' ? 'admin123' : 'developer123');
                setErrorMsg('');
              }}
            >
              {u.username}
            </button>
          ))}
        </div>

        {/* Password Form */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-input-group">
            <Lock size={16} className="login-input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="login-password-input"
            />
            <button type="submit" className="login-submit-btn" disabled={isLoading} title="Sign In">
              <ArrowRight size={16} />
            </button>
          </div>

          {errorMsg && <div className="login-error-text">{errorMsg}</div>}
        </form>

        <div className="login-footer-hint">
          <span>WebOS Secure Authentication System</span>
        </div>
      </div>
    </div>
  );
};
