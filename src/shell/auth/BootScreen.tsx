import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Monitor, Cpu, HardDrive } from 'lucide-react';
import './boot.css';

export const BootScreen: React.FC = () => {
  const { bootProgress } = useAuthStore();

  return (
    <div className="boot-screen-container">
      <div className="boot-logo-wrapper">
        <div className="boot-logo-icon">
          <Monitor size={54} className="text-cyan-400" />
        </div>
        <h1 className="boot-title">WebOS 2.0 Enterprise</h1>
        <div className="boot-subtitle">Initializing Microkernel & Subsystems...</div>
      </div>

      <div className="boot-progress-wrapper">
        <div className="boot-progress-bar">
          <div className="boot-progress-fill" style={{ width: `${bootProgress}%` }} />
        </div>
        <div className="boot-diagnostics-text">
          {bootProgress < 30 && 'Checking CPU, RAM and hardware registers...'}
          {bootProgress >= 30 && bootProgress < 70 && 'Mounting POSIX Virtual Filesystem (rootfs)...'}
          {bootProgress >= 70 && bootProgress < 95 && 'Starting Preemptive Process Scheduler & Desktop Shell...'}
          {bootProgress >= 95 && 'Ready.'}
        </div>
      </div>

      <div className="boot-footer-specs">
        <span><Cpu size={12} /> WebOS Virtual Processor v4</span>
        <span><HardDrive size={12} /> VFS rootfs mounted at /</span>
      </div>
    </div>
  );
};
