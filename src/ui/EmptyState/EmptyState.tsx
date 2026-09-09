import React from 'react';
import clsx from 'clsx';
import './EmptyState.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={clsx('os-empty-state', className)} data-testid="empty-state">
      {icon && <div className="os-empty-state__icon">{icon}</div>}
      <h4 className="os-empty-state__title">{title}</h4>
      {description && <p className="os-empty-state__description">{description}</p>}
      {action && <div className="os-empty-state__action">{action}</div>}
    </div>
  );
};
