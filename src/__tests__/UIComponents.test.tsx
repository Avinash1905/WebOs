import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../ui/Button/Button';
import { IconButton } from '../ui/IconButton/IconButton';
import { Badge } from '../ui/Badge/Badge';
import { Input } from '../ui/Input/Input';
import { Panel } from '../ui/Panel/Panel';
import { ContextMenu } from '../ui/ContextMenu/ContextMenu';
import { Toggle } from '../ui/Toggle/Toggle';
import { Slider } from '../ui/Slider/Slider';
import { SegmentedControl } from '../ui/SegmentedControl/SegmentedControl';
import { EmptyState } from '../ui/EmptyState/EmptyState';
import { Popover } from '../ui/Popover/Popover';

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

  it('renders Toggle and triggers onChange', () => {
    const handleToggle = vi.fn();
    render(<Toggle checked={false} onChange={handleToggle} label="Dark Mode" />);

    const toggleBtn = screen.getByRole('switch', { name: 'Dark Mode' });
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it('renders Slider and updates value', () => {
    const handleSlider = vi.fn();
    render(<Slider min={0} max={100} value={50} onChange={handleSlider} aria-label="Volume" />);

    const sliderInput = screen.getByRole('slider', { name: 'Volume' });
    expect(sliderInput).toBeInTheDocument();
    fireEvent.change(sliderInput, { target: { value: '80' } });
    expect(handleSlider).toHaveBeenCalledWith(80);
  });

  it('renders SegmentedControl and switches active segment', () => {
    const handleSelect = vi.fn();
    render(
      <SegmentedControl
        options={[
          { id: 'grid', label: 'Grid' },
          { id: 'list', label: 'List' },
        ]}
        value="grid"
        onChange={handleSelect}
      />
    );

    const listOption = screen.getByText('List');
    fireEvent.click(listOption);
    expect(handleSelect).toHaveBeenCalledWith('list');
  });

  it('renders EmptyState with title and description', () => {
    render(
      <EmptyState
        title="No Items"
        description="Nothing to display here"
      />
    );

    expect(screen.getByText('No Items')).toBeInTheDocument();
    expect(screen.getByText('Nothing to display here')).toBeInTheDocument();
  });

  it('renders Popover when isOpen is true', () => {
    render(
      <Popover isOpen={true} onClose={vi.fn()}>
        <div>Popover Body</div>
      </Popover>
    );

    expect(screen.getByText('Popover Body')).toBeInTheDocument();
  });
});
