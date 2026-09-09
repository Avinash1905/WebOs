/**
 * @file AppWindowManagerLayout.ts
 * @description Binary Space Partitioning (BSP) tiling and Master-Stack window geometry manager.
 */

export interface WindowRect {
  readonly id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class AppWindowManagerLayout {
  public static computeMasterStackLayout(
    windowIds: readonly string[],
    screenWidth: number,
    screenHeight: number,
    masterRatio: number = 0.6
  ): WindowRect[] {
    if (windowIds.length === 0) return [];
    if (windowIds.length === 1) {
      return [{ id: windowIds[0]!, x: 0, y: 0, width: screenWidth, height: screenHeight }];
    }

    const masterWidth = Math.floor(screenWidth * masterRatio);
    const stackWidth = screenWidth - masterWidth;
    const stackCount = windowIds.length - 1;
    const stackHeight = Math.floor(screenHeight / stackCount);

    const rects: WindowRect[] = [];

    // Master window
    rects.push({
      id: windowIds[0]!,
      x: 0,
      y: 0,
      width: masterWidth,
      height: screenHeight,
    });

    // Stack windows
    for (let i = 1; i < windowIds.length; i++) {
      rects.push({
        id: windowIds[i]!,
        x: masterWidth,
        y: (i - 1) * stackHeight,
        width: stackWidth,
        height: i === windowIds.length - 1 ? screenHeight - ((i - 1) * stackHeight) : stackHeight,
      });
    }

    return rects;
  }

  public static computeGrid(
    windowIds: readonly string[],
    screenWidth: number,
    screenHeight: number
  ): WindowRect[] {
    const count = windowIds.length;
    if (count === 0) return [];

    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const cellWidth = Math.floor(screenWidth / cols);
    const cellHeight = Math.floor(screenHeight / rows);

    return windowIds.map((id, index) => {
      const c = index % cols;
      const r = Math.floor(index / cols);
      return {
        id,
        x: c * cellWidth,
        y: r * cellHeight,
        width: cellWidth,
        height: cellHeight,
      };
    });
  }
}
