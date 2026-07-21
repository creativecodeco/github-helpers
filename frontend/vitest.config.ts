import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'happy-dom',
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests-e2e/**']
  }
});
