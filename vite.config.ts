/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'lucide-react': path.resolve(__dirname, './src/utils/lucideShim.tsx'),
    },
  },
  test: {
    globals: true,
    environmentMatchGlobs: [
      ['**/src/__tests__/**', 'jsdom'],
      ['**/tests/**', 'node'],
    ],
    setupFiles: ['./src/__tests__/setup.ts'],
    css: false,
    pool: 'forks',
  },
});
