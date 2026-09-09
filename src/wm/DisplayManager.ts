/**
 * DisplayManager.ts
 * Manages viewport dimensions, multi-monitor/screen bounds calculations,
 * and automatic window geometry recovery when the browser viewport resizes,
 * taskbar docking changes, or invalid off-screen window positions are loaded.
 */

export interface ViewportBounds {
  width: number;
  height: number;
  availableWidth: number;
  availableHeight: number;
  topOffset: number;
  bottomOffset: number;
  leftOffset: number;
  rightOffset: number;
}

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class DisplayManager {
  private static instance: DisplayManager;
  private listeners: Set<(bounds: ViewportBounds) => void> = new Set();
  private currentBounds: ViewportBounds = {
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    availableWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
    availableHeight: typeof window !== 'undefined' ? window.innerHeight - 48 : 1032,
    topOffset: 0,
    bottomOffset: 48, // Standard taskbar height
    leftOffset: 0,
    rightOffset: 0,
  };

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize);
      this.updateBounds();
    }
  }

  public static getInstance(): DisplayManager {
    if (!DisplayManager.instance) {
      DisplayManager.instance = new DisplayManager();
    }
    return DisplayManager.instance;
  }

  private handleResize = () => {
    this.updateBounds();
  };

  public updateBounds(taskbarPosition: 'bottom' | 'top' | 'left' | 'right' = 'bottom', taskbarSize: number = 48): ViewportBounds {
    if (typeof window === 'undefined') return this.currentBounds;

    const w = window.innerWidth;
    const h = window.innerHeight;

    let topOffset = 0;
    let bottomOffset = 0;
    let leftOffset = 0;
    let rightOffset = 0;

    switch (taskbarPosition) {
      case 'top':
        topOffset = taskbarSize;
        break;
      case 'bottom':
        bottomOffset = taskbarSize;
        break;
      case 'left':
        leftOffset = taskbarSize;
        break;
      case 'right':
        rightOffset = taskbarSize;
        break;
    }

    this.currentBounds = {
      width: w,
      height: h,
      availableWidth: Math.max(320, w - leftOffset - rightOffset),
      availableHeight: Math.max(240, h - topOffset - bottomOffset),
      topOffset,
      bottomOffset,
      leftOffset,
      rightOffset,
    };

    this.notifyListeners();
    return this.currentBounds;
  }

  public getBounds(): ViewportBounds {
    return { ...this.currentBounds };
  }

  public subscribe(callback: (bounds: ViewportBounds) => void): () => void {
    this.listeners.add(callback);
    callback(this.getBounds());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const bounds = this.getBounds();
    this.listeners.forEach((listener) => {
      try {
        listener(bounds);
      } catch (err) {
        console.error('DisplayManager listener error:', err);
      }
    });
  }

  /**
   * Clamps a window rectangle to ensure it is comfortably accessible within the current viewport.
   * Prevents windows from being permanently hidden off-screen or having their titlebars inaccessible.
   */
  public clampWindowGeometry(
    rect: WindowRect,
    minWidth: number = 280,
    minHeight: number = 180
  ): WindowRect {
    const bounds = this.currentBounds;
    const clampedWidth = Math.max(minWidth, Math.min(rect.width, bounds.availableWidth));
    const clampedHeight = Math.max(minHeight, Math.min(rect.height, bounds.availableHeight));

    // Ensure titlebar (top 36px) is always reachable within bounds
    const minX = bounds.leftOffset;
    const maxX = Math.max(minX, bounds.width - bounds.rightOffset - 100); // at least 100px visible horizontally
    const minY = bounds.topOffset;
    const maxY = Math.max(minY, bounds.height - bounds.bottomOffset - 40); // at least titlebar visible vertically

    let clampedX = rect.x;
    let clampedY = rect.y;

    // Clamp X within visible viewport
    if (clampedX < minX) {
      clampedX = minX;
    } else if (clampedX > maxX) {
      clampedX = Math.max(minX, bounds.width - bounds.rightOffset - clampedWidth - 20);
    }

    // Clamp Y within visible viewport (above taskbar, below top offset)
    if (clampedY < minY) {
      clampedY = minY;
    } else if (clampedY > maxY) {
      clampedY = Math.max(minY, bounds.height - bounds.bottomOffset - clampedHeight - 20);
    }

    return {
      x: Math.round(clampedX),
      y: Math.round(clampedY),
      width: Math.round(clampedWidth),
      height: Math.round(clampedHeight),
    };
  }

  /**
   * Calculates cascade placement for a new window or a sequence of windows.
   */
  public calculateCascadePosition(index: number, width: number = 640, height: number = 440): WindowRect {
    const bounds = this.currentBounds;
    const step = 32;
    const maxCascadeIndex = Math.max(1, Math.floor((bounds.availableHeight - height) / step));
    const normalizedIndex = index % maxCascadeIndex;

    const x = bounds.leftOffset + 40 + normalizedIndex * step;
    const y = bounds.topOffset + 40 + normalizedIndex * step;

    return this.clampWindowGeometry({
      x,
      y,
      width,
      height,
    });
  }

  /**
   * Arranges an array of window IDs in a grid or tiled layout across available screen space.
   */
  public calculateTileLayout(windowCount: number): WindowRect[] {
    if (windowCount <= 0) return [];

    const bounds = this.currentBounds;
    const cols = windowCount <= 2 ? windowCount : Math.ceil(Math.sqrt(windowCount));
    const rows = Math.ceil(windowCount / cols);

    const cellWidth = Math.floor(bounds.availableWidth / cols);
    const cellHeight = Math.floor(bounds.availableHeight / rows);

    const layouts: WindowRect[] = [];
    for (let i = 0; i < windowCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      layouts.push({
        x: bounds.leftOffset + col * cellWidth,
        y: bounds.topOffset + row * cellHeight,
        width: cellWidth,
        height: cellHeight,
      });
    }

    return layouts;
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
    this.listeners.clear();
  }
}
