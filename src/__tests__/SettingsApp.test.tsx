import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsApp } from '../shell/settings/SettingsApp';
import { useThemeStore } from '../stores/themeStore';

describe('Settings Application Subsystem', () => {
  beforeEach(() => {
    useThemeStore.getState().resetToDefaults();
  });

  it('renders SettingsApp and switches between navigation tabs', () => {
    render(<SettingsApp />);

    expect(screen.getByTestId('settings-app')).toBeInTheDocument();
    expect(screen.getByText('Color Theme Preset')).toBeInTheDocument();

    // Switch to Wallpaper tab
    const wallpaperTab = screen.getByRole('button', { name: /wallpaper/i });
    fireEvent.click(wallpaperTab);
    expect(screen.getByText('Wallpaper Fit Mode')).toBeInTheDocument();

    // Switch to Shortcuts tab
    const shortcutsTab = screen.getByRole('button', { name: /shortcuts/i });
    fireEvent.click(shortcutsTab);
    expect(screen.getByPlaceholderText(/search shortcuts/i)).toBeInTheDocument();

    // Switch to Taskbar tab
    const taskbarTab = screen.getByRole('button', { name: /taskbar & clock/i });
    fireEvent.click(taskbarTab);
    expect(screen.getByText('Taskbar Screen Position')).toBeInTheDocument();

    // Switch to Accessibility tab
    const a11yTab = screen.getByRole('button', { name: /accessibility/i });
    fireEvent.click(a11yTab);
    expect(screen.getByText('High Contrast Mode (WCAG AAA)')).toBeInTheDocument();
  });
});
