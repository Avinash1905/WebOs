import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CalendarPopover } from '../shell/taskbar/CalendarPopover';

describe('Calendar Popover', () => {
  it('renders days and allows month navigation', () => {
    const handleClose = vi.fn();
    render(<CalendarPopover isOpen={true} onClose={handleClose} />);

    expect(screen.getByRole('dialog', { name: /interactive calendar/i })).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /next month/i });
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);

    const prevBtn = screen.getByRole('button', { name: /previous month/i });
    fireEvent.click(prevBtn);
  });
});
