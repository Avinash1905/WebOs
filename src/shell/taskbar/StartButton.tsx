import React from 'react';
import clsx from 'clsx';
import { useStartMenuStore } from '../../stores/startMenuStore';

export interface StartButtonProps {
  className?: string;
}

export const StartButton: React.FC<StartButtonProps> = ({ className }) => {
  const { isOpen: isStartMenuOpen, toggleStartMenu } = useStartMenuStore();

  return (
    <button
      type="button"
      aria-label="Start Menu"
      aria-expanded={isStartMenuOpen}
      data-testid="start-button"
      className={clsx(
        'os-start-button',
        isStartMenuOpen && 'os-start-button--active',
        className
      )}
      onClick={toggleStartMenu}
    >
      <div className="os-start-button__logo">
        <span className="os-start-button__tile os-start-button__tile--1" />
        <span className="os-start-button__tile os-start-button__tile--2" />
        <span className="os-start-button__tile os-start-button__tile--3" />
        <span className="os-start-button__tile os-start-button__tile--4" />
      </div>
      <span className="os-start-button__label">Start</span>
    </button>
  );
};
