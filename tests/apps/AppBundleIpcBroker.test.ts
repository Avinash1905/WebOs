import { describe, expect, it } from 'vitest';
import {
  AppBundlePackageManager,
  AppIpcBroker,
} from '../../core/apps/index.js';

describe('App Bundle and IPC Broker', () => {
  it('AppBundlePackageManager packages manifests and files and verifies signatures', () => {
    const manifest = { id: 'org.webos.media', version: '2.0.0', name: 'Media Player' };
    const files = [{ path: 'main.js', content: 'console.log("playing");' }];

    const bundle = AppBundlePackageManager.package(manifest, files);
    expect(bundle.signature).toBeDefined();

    const result = AppBundlePackageManager.verifyAndUnpack(bundle);
    expect(result.valid).toBe(true);
    expect(result.manifest?.['id']).toBe('org.webos.media');
  });

  it('AppIpcBroker registers inter-app methods and invokes procedures remotely', async () => {
    const broker = new AppIpcBroker();

    broker.registerMethod('org.webos.Calculator', 'add', (params: any) => {
      return params.a + params.b;
    });

    const sum = await broker.callMethod('org.webos.Calculator', 'add', { a: 15, b: 25 });
    expect(sum).toBe(40);
  });
});
