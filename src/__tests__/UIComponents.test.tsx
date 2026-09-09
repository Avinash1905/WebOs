import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../ui/Button/Button';
import { IconButton } from '../ui/IconButton/IconButton';
import { Badge } from '../ui/Badge/Badge';
import { Input } from '../ui/Input/Input';
import { Panel } from '../ui/Panel/Panel';
import { ContextMenu } from '../ui/ContextMenu/ContextMenu';

describe('Shared UI Components', () => {
  it('renders Button and triggers click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} variant="primary">Launch</Button>);

    const btn = screen.getByRole('button', { name: /launch/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders IconButton with accessible label', () => {
    render(<IconButton icon={<span>⚡</span>} aria-label="Settings" />);
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('renders Badge with text and variants', () => {
    render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders Input and handles value changes', () => {
    const handleChange = vi.fn();
    render(<Input placeholder="Search WebOS..." onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Search WebOS...');
    fireEvent.change(input, { target: { value: 'test query' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders Panel with glass styling', () => {
    render(<Panel variant="glass">Panel Content</Panel>);
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('renders ContextMenu and closes on escape', () => {
    const handleClose = vi.fn();
    const handleItemClick = vi.fn();

    render(
      <ContextMenu
        x={100}
        y={100}
        onClose={handleClose}
        items={[
          { id: 'item-1', label: 'Item 1', onClick: handleItemClick },
        ]}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Item 1'));
    expect(handleItemClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });
});
