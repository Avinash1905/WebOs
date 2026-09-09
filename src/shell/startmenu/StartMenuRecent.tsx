import React from 'react';
import { Clock, FileText, Terminal as TerminalIcon } from 'lucide-react';

export const StartMenuRecent: React.FC = () => {
  const recentItems = [
    { id: 'rec-1', title: 'welcome_guide.txt', subtitle: 'Modified 10m ago', icon: FileText, color: '#60a5fa' },
    { id: 'rec-2', title: 'sys_benchmark.sh', subtitle: 'Opened 1h ago', icon: TerminalIcon, color: '#34d399' },
  ];

  return (
    <div className="os-start-menu__section">
      <div className="os-start-menu__section-header">
        <span className="os-start-menu__section-title">
          <Clock size={13} /> Recommended & Recent
        </span>
      </div>

      <div className="os-start-menu__recent-grid">
        {recentItems.map((item) => {
          const IconComp = item.icon;
          return (
            <div key={item.id} className="os-start-menu__recent-item" role="button" tabIndex={0}>
              <div className="os-start-menu__recent-icon" style={{ color: item.color }}>
                <IconComp size={18} />
              </div>
              <div className="os-start-menu__recent-meta">
                <span className="os-start-menu__recent-title">{item.title}</span>
                <span className="os-start-menu__recent-subtitle">{item.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
