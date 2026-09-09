import React, { useState } from 'react';
import { appRegistry } from '../../contracts/appRegistry';
import { FileText, Globe, Terminal, Image, Music, Film, Check, RotateCcw } from 'lucide-react';
import { useAnnouncer } from '../../a11y/useAnnouncer';

interface DefaultAppCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultAppId: string;
  allowedAppIds: string[];
}

const INITIAL_DEFAULT_CATEGORIES: DefaultAppCategory[] = [
  {
    id: 'web_browser',
    label: 'Web Browser',
    description: 'Opens HTTP, HTTPS links and HTML files',
    icon: <Globe size={18} className="text-cyan-400" />,
    defaultAppId: 'browser',
    allowedAppIds: ['browser', 'editor'],
  },
  {
    id: 'text_editor',
    label: 'Text & Code Editor',
    description: 'Opens .txt, .md, .js, .ts, .json, .css source files',
    icon: <FileText size={18} className="text-blue-400" />,
    defaultAppId: 'editor',
    allowedAppIds: ['editor', 'terminal'],
  },
  {
    id: 'terminal_emulator',
    label: 'Terminal Shell',
    description: 'Default CLI command execution environment',
    icon: <Terminal size={18} className="text-emerald-400" />,
    defaultAppId: 'terminal',
    allowedAppIds: ['terminal'],
  },
  {
    id: 'image_viewer',
    label: 'Photo & Image Viewer',
    description: 'Opens PNG, JPEG, SVG, WebP graphic assets',
    icon: <Image size={18} className="text-amber-400" />,
    defaultAppId: 'browser',
    allowedAppIds: ['browser', 'editor'],
  },
  {
    id: 'music_player',
    label: 'Audio Player',
    description: 'Plays MP3, WAV, FLAC, OGG audio files',
    icon: <Music size={18} className="text-pink-400" />,
    defaultAppId: 'browser',
    allowedAppIds: ['browser'],
  },
  {
    id: 'video_player',
    label: 'Video Player',
    description: 'Plays MP4, WebM video media',
    icon: <Film size={18} className="text-purple-400" />,
    defaultAppId: 'browser',
    allowedAppIds: ['browser'],
  },
];

export const DefaultAppsSettings: React.FC = () => {
  const [defaults, setDefaults] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    INITIAL_DEFAULT_CATEGORIES.forEach((c) => {
      initial[c.id] = c.defaultAppId;
    });
    return initial;
  });

  const { announce } = useAnnouncer();

  const handleSelect = (categoryId: string, appId: string) => {
    setDefaults((prev) => ({ ...prev, [categoryId]: appId }));
    const app = appRegistry.getApplication(appId);
    announce(`Default application for ${categoryId.replace('_', ' ')} set to ${app?.name || appId}`);
  };

  const handleReset = () => {
    const initial: Record<string, string> = {};
    INITIAL_DEFAULT_CATEGORIES.forEach((c) => {
      initial[c.id] = c.defaultAppId;
    });
    setDefaults(initial);
    announce('Default applications reset to system defaults');
  };

  return (
    <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--os-text-primary, #fff)', margin: 0 }}>
            Default Applications
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--os-text-secondary, #94a3b8)', marginTop: '4px' }}>
            Choose which applications WebOS uses to open specific files and protocols.
          </p>
        </div>
        <button
          className="settings-button"
          onClick={handleReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px',
            color: '#cbd5e1',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} />
          Reset Defaults
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {INITIAL_DEFAULT_CATEGORIES.map((cat) => {
          const selectedAppId = defaults[cat.id] || cat.defaultAppId;
          const selectedApp = appRegistry.getApplication(selectedAppId);

          return (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cat.icon}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--os-text-primary, #fff)' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--os-text-secondary, #94a3b8)' }}>
                    {cat.description}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={selectedAppId}
                  onChange={(e) => handleSelect(cat.id, e.target.value)}
                  aria-label={`Default app for ${cat.label}`}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {cat.allowedAppIds.map((appId) => {
                    const app = appRegistry.getApplication(appId);
                    return (
                      <option key={appId} value={appId} style={{ background: '#0f172a', color: '#fff' }}>
                        {app?.name || appId}
                      </option>
                    );
                  })}
                </select>
                {selectedApp && (
                  <Check size={16} style={{ color: 'var(--os-accent-primary, #38bdf8)' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
