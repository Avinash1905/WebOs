import { describe, it, expect } from 'vitest';
import {
  detectSnapZone,
  calculateSnapBounds,
  clampBoundsToViewport,
  type ViewportDimensions,
} from '../wm/WindowGeometry';

describe('Window Geometry & Snap Calculations', () => {
  const mockViewport: ViewportDimensions = {
    width: 1920,
    height: 1080,
    availableHeight: 1032,
  };

  it('detects snap zones based on pointer coordinates', () => {
    // Top edge
    expect(detectSnapZone(500, 5, mockViewport)).toBe('top');

    // Left edge
    expect(detectSnapZone(5, 500, mockViewport)).toBe('left');

    // Right edge
    expect(detectSnapZone(1915, 500, mockViewport)).toBe('right');

    // Corners
    expect(detectSnapZone(10, 10, mockViewport)).toBe('top-left');
    expect(detectSnapZone(1910, 10, mockViewport)).toBe('top-right');

    // Middle / no snap
    expect(detectSnapZone(500, 500, mockViewport)).toBe('none');
  });

  it('calculates correct snap bounds for half-screen and maximize zones', () => {
    const leftBounds = calculateSnapBounds('left', mockViewport);
    expect(leftBounds).toEqual({
      x: 0,
      y: 0,
      width: 960,
      height: 1032,
    });

    const rightBounds = calculateSnapBounds('right', mockViewport);
    expect(rightBounds).toEqual({
      x: 960,
      y: 0,
      width: 960,
      height: 1032,
    });

    const topBounds = calculateSnapBounds('top', mockViewport);
    expect(topBounds).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 1032,
    });
  });

  it('clamps bounds to keep windows accessible in the viewport', () => {
    const outOfBounds = {
      x: -1000,
      y: -500,
      width: 800,
      height: 600,
    };

    const clamped = clampBoundsToViewport(outOfBounds, 320, 200, mockViewport);
    expect(clamped.y).toBe(0);
    expect(clamped.x).toBeGreaterThan(-800);
  });
});
