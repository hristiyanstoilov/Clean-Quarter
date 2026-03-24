// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    // Vite build-time replacements — needed for tests that import service-worker source
    '__SW_VERSION__': JSON.stringify('clean-quarter-v1'),
  },
  test: {
    setupFiles: ['./vitest.setup.js'],
    include: [
      'tests/**/*.test.js',
      'src/**/__tests__/**/*.test.js'
    ],
    environment: 'node',
    globals: true
  }
});
