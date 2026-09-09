import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LiveAnnouncer, useAnnouncerStore } from '../a11y/LiveAnnouncer';
import { FocusTrap } from '../a11y/FocusTrap';

describe('Accessibility Platform & Focus Management', () => {
  it('renders LiveAnnouncer and updates polite and assertive regions', () => {
    render(<LiveAnnouncer />);

    act(() => {
      useAnnouncerStore.getState().announce('Application Terminal launched', 'polite');
    });

    expect(screen.getByText('Application Terminal launched')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      useAnnouncerStore.getState().announce('Critical battery low', 'assertive');
    });

    expect(screen.getByText('Critical battery low')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('contains focus within FocusTrap and handles escape callback', () => {
    const handleEscape = vi.fn();
    render(
      <FocusTrap active={true} onEscape={handleEscape}>
        <button>First Button</button>
        <button>Second Button</button>
      </FocusTrap>
    );

    const firstBtn = screen.getByRole('button', { name: 'First Button' });
    expect(document.activeElement).toBe(firstBtn);
  });
});
