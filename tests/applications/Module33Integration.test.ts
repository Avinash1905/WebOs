/**
 * @file tests/applications/Module33Integration.test.ts
 * @description Integration test suite for WebOS Module 3.3 — Calculation, Data & Management Applications.
 */

import { describe, it, expect } from 'vitest';
import { appRegistry } from '../../src/contracts/appRegistry.js';
import { useWindowStore } from '../../src/stores/windowStore.js';
import { platform } from '../../src/services/webosPlatform.js';
import { ExpressionParser } from '../../applications/calculator/engine/ExpressionParser.js';
import { DependencyGraph } from '../../applications/spreadsheet/engine/DependencyGraph.js';
import { DatabaseService } from '../../applications/database-viewer/engine/DatabaseService.js';
import { TaskManagerService } from '../../applications/task-manager/engine/TaskManagerService.js';

describe('Module 3.3 — App Registry & Integration Test Suite', () => {
  it('should verify all 4 Module 3.3 applications are registered in AppRegistry', () => {
    const calcApp = appRegistry.getApplication('calculator');
    const sheetApp = appRegistry.getApplication('spreadsheet');
    const dbApp = appRegistry.getApplication('database-viewer');
    const taskApp = appRegistry.getApplication('task-manager');

    expect(calcApp).toBeDefined();
    expect(calcApp?.name).toBe('Calculator');

    expect(sheetApp).toBeDefined();
    expect(sheetApp?.name).toBe('Spreadsheet');

    expect(dbApp).toBeDefined();
    expect(dbApp?.name).toBe('Database Viewer');

    expect(taskApp).toBeDefined();
    expect(taskApp?.name).toBe('Task Manager');
  });

  it('should launch all 4 applications in WindowManager without errors', () => {
    const windowStore = useWindowStore.getState();

    const calcWinId = windowStore.openWindow({ id: 'win-calc', appId: 'calculator', title: 'Calculator' });
    const sheetWinId = windowStore.openWindow({ id: 'win-sheet', appId: 'spreadsheet', title: 'Spreadsheet' });
    const dbWinId = windowStore.openWindow({ id: 'win-db', appId: 'database-viewer', title: 'Database Viewer' });
    const taskWinId = windowStore.openWindow({ id: 'win-task', appId: 'task-manager', title: 'Task Manager' });

    expect(calcWinId).toBe('win-calc');
    expect(sheetWinId).toBe('win-sheet');
    expect(dbWinId).toBe('win-db');
    expect(taskWinId).toBe('win-task');

    const windows = useWindowStore.getState().windows;
    expect(windows.length).toBeGreaterThanOrEqual(4);

    // Clean up windows
    windowStore.closeWindow('win-calc');
    windowStore.closeWindow('win-sheet');
    windowStore.closeWindow('win-db');
    windowStore.closeWindow('win-task');
  });

  it('should initialize WebOS Platform Service bridge', async () => {
    await platform.initialize();
    expect(platform.kernel).toBeDefined();
    expect(platform.eventBus).toBeDefined();
    expect(platform.fileSystem).toBeDefined();
    expect(platform.storage).toBeDefined();
  });
});
