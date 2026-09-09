/**
 * @file DevToolsIntegration.test.ts
 * @description End-to-end integration tests between Terminal, Code Editor, Member 2 Shell, VFS, and App Registry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { platform } from '../../src/services/webosPlatform.js';
import { useTerminalStore } from '../../applications/terminal/store/terminalStore.js';
import { useCodeEditorStore } from '../../applications/code-editor/store/codeEditorStore.js';
import { appRegistry } from '../../src/contracts/appRegistry.js';

describe('Developer Tools & Terminal Integration Workflows', () => {
  beforeEach(async () => {
    await platform.initialize();
  });

  it('Workflow 1: Create file in Code Editor -> Save to VFS -> Modify via Terminal -> Reopen in Code Editor', async () => {
    const editorStore = useCodeEditorStore.getState();

    // 1. Create file in Code Editor
    editorStore.createNewFile('script.js', 'console.log("Hello from Code Editor");');
    await editorStore.saveActiveFileAs('/home/user/script.js');

    expect(await platform.fileSystem.exists('/home/user/script.js')).toBe(true);

    // 2. Modify via Terminal
    const termStore = useTerminalStore.getState();
    termStore.createNewTab('Shell', '/home/user');
    await termStore.executeCommandInActiveTab('echo "console.log(\\"Appended by Shell\\");" >> /home/user/script.js');

    // 3. Reopen in Code Editor
    useCodeEditorStore.setState({ tabs: [], activeTabId: null });
    await editorStore.openFileInEditor('/home/user/script.js');

    const updatedTab = useCodeEditorStore.getState().tabs[0];
    expect(updatedTab).toBeDefined();
    expect(updatedTab!.content).toContain('Hello from Code Editor');
    expect(updatedTab!.content).toContain('Appended by Shell');
  });

  it('Workflow 2: App Registry verification & Member 2 Shell execution', async () => {
    const termApp = appRegistry.getApplication('terminal');
    const codeApp = appRegistry.getApplication('code-editor');

    expect(termApp).toBeDefined();
    expect(termApp!.category).toBe('Development');

    expect(codeApp).toBeDefined();
    expect(codeApp!.category).toBe('Development');

    // Execute shell command to verify registered apps via CLI
    const res = await platform.shell.executeCommand('apps');
    expect(res.code).toBe(0);
    expect(res.output).toContain('terminal');
    expect(res.output).toContain('code-editor');
  });
});
