# WebOS Cross-Team Integration Guide
**Author: MEMBER 1 — Desktop Environment & UI Platform**  
**Audience:** Members 2 (OS Core), 3 (Applications), and 4 (Backend / Cloud)

---

## 1. Member 2 Integration (OS Core / Processes / VFS)

Member 1 consumes OS Core capabilities via the typed `IMember2OSCoreContract` interface located in [`src/contracts/member2Adapters.ts`](file:///c:/Users/HP/OneDrive/Desktop/WebOs/src/contracts/member2Adapters.ts).

### Connecting Real Kernel Runtime:
Member 2 injects the runtime object onto `window.__WEBOS_CORE__`:

```typescript
// Member 2 Kernel Initialization
window.__WEBOS_CORE__ = {
  spawnProcess: async (options) => { /* spawn in kernel process tree */ },
  killProcess: async (pid, signal) => { /* terminate process */ },
  listProcesses: async () => { /* return ProcessInfo[] */ },
  readFile: async (path) => { /* VFS read */ },
  writeFile: async (path, content) => { /* VFS write */ },
  listDirectory: async (path) => { /* VFS dir listing */ },
  dispatchSystemEvent: (event) => { /* dispatch to IPC bus */ },
  onSystemEvent: (type, handler) => { /* subscribe */ },
  readClipboard: async () => { /* clipboard */ },
  writeClipboard: async (text) => { /* clipboard */ },
  queryPermission: async (perm) => { /* query sandbox permission */ }
};
```

When offline or during unit testing, `Member2OSBridge` provides an automated fallback simulation.

---

## 2. Member 3 Integration (Application Window SDK)

Applications built by Member 3 are hosted seamlessly within the WebOS Window Manager using the `useAppWindow` hook and `AppContainer` component in [`src/contracts/member3Adapters.ts`](file:///c:/Users/HP/OneDrive/Desktop/WebOs/src/contracts/member3Adapters.ts).

### Application Component Template:
```tsx
import React from 'react';
import { useAppWindow, AppContainer } from '../contracts/member3Adapters';

export const CalculatorApp: React.FC<{ windowId: string; appId: string }> = ({ windowId, appId }) => {
  const win = useAppWindow(windowId, appId);

  const handleCompute = () => {
    win.showNotification({
      title: 'Calculation Complete',
      message: 'Result: 42',
      type: 'success',
    });
  };

  return (
    <AppContainer padding={16}>
      <h2>{win.title}</h2>
      <button onClick={handleCompute}>Calculate</button>
      <button onClick={win.close}>Exit</button>
    </AppContainer>
  );
};
```

### Registering Applications:
Register the application manifest into `appRegistry` (`src/contracts/appRegistry.ts`):
```typescript
appRegistry.registerApplication({
  id: 'my-app',
  name: 'My Custom App',
  category: 'Productivity',
  icon: MyIcon,
  version: '1.0.0',
  defaultBounds: { width: 640, height: 480 },
  showOnDesktop: true,
  isPinnedToTaskbar: true,
  component: CalculatorApp,
});
```

---

## 3. Member 4 Integration (Persistence & Cloud Synchronization)

Member 4 integrates cloud synchronization for user themes, wallpapers, shortcuts, taskbar configuration, and desktop icon arrangements via [`src/contracts/member4Adapters.ts`](file:///c:/Users/HP/OneDrive/Desktop/WebOs/src/contracts/member4Adapters.ts).

### Connecting Cloud Storage:
Member 4 injects the cloud backend adapter onto `window.__WEBOS_BACKEND__`:

```typescript
window.__WEBOS_BACKEND__ = {
  getCurrentUser: async () => ({ id: 'usr-1', username: 'alice', displayName: 'Alice', role: 'user' }),
  saveUserSettings: async (payload) => { /* PUT /api/user/settings */ return true; },
  loadUserSettings: async () => { /* GET /api/user/settings */ return payload; },
  subscribeToSyncEvents: (listener) => { /* WebSocket sync handler */ return () => {}; },
  uploadWallpaperAsset: async (file, name) => { /* POST /api/user/wallpapers */ return 'https://...'; },
};
```
