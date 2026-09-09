import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../errors/ErrorBoundary';
import { WindowErrorBoundary } from '../errors/WindowErrorBoundary';

const FaultyComponent = () => {
  throw new Error('Test Component Crash');
};

describe('Error Boundaries & Crash Isolation', () => {
  it('catches render error and displays recovery fallback', () => {
    // Suppress console.error in test output for intentional error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallbackTitle="Shell Subsystem Crash">
        <FaultyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Shell Subsystem Crash')).toBeInTheDocument();
    expect(screen.getByText('Test Component Crash')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    spy.mockRestore();
  });

  it('isolates application window crash in WindowErrorBoundary', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <WindowErrorBoundary appTitle="Broken App">
        <FaultyComponent />
      </WindowErrorBoundary>
    );

    expect(screen.getByText('Broken App crashed')).toBeInTheDocument();
    expect(screen.getByText('Test Component Crash')).toBeInTheDocument();

    const relaunchBtn = screen.getByRole('button', { name: /relaunch window content/i });
    expect(relaunchBtn).toBeInTheDocument();
    fireEvent.click(relaunchBtn);

    spy.mockRestore();
  });
});
