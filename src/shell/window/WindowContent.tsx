import React from 'react';

export interface WindowContentProps {
  children?: React.ReactNode;
  className?: string;
}

export const WindowContent: React.FC<WindowContentProps> = ({ children, className }) => {
  return (
    <div className={`os-window-content ${className || ''}`} tabIndex={-1}>
      {children}
    </div>
  );
};
