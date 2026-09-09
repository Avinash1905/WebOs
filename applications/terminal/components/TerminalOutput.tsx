import React, { useEffect, useRef } from 'react';
import type { TerminalOutputLine } from '../types.js';

interface TerminalOutputProps {
  lines: TerminalOutputLine[];
  autoScroll?: boolean;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ lines, autoScroll = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  return (
    <div className="terminal-output-container" ref={containerRef}>
      {lines.map((line) => {
        let lineClass = 'terminal-line';
        if (line.type === 'prompt') lineClass += ' line-prompt';
        else if (line.type === 'error') lineClass += ' line-error';
        else if (line.type === 'success') lineClass += ' line-success';
        else if (line.type === 'warning') lineClass += ' line-warning';
        else if (line.type === 'info') lineClass += ' line-info';

        return (
          <div key={line.id} className={lineClass}>
            <pre className="terminal-line-content">{line.content}</pre>
          </div>
        );
      })}
    </div>
  );
};
