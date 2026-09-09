import React from 'react';
import { useCodeEditorStore } from '../store/codeEditorStore.js';

interface EditorMinimapProps {
  content: string;
}

export const EditorMinimap: React.FC<EditorMinimapProps> = ({ content }) => {
  const { settings } = useCodeEditorStore();
  if (!settings.showMinimap) return null;

  const lines = content.split('\n').slice(0, 200);

  return (
    <div className="editor-minimap-panel">
      <div className="minimap-content">
        {lines.map((line, idx) => {
          const trimmedLength = Math.min(line.length, 60);
          return (
            <div key={idx} className="minimap-line">
              <div
                className="minimap-line-fill"
                style={{ width: `${Math.max(4, trimmedLength * 2)}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="minimap-viewport-slider" />
    </div>
  );
};
