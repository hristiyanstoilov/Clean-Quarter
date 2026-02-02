// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  setupFiles: ['./vitest.setup.js'],
  test: {
    include: [
      'tests/**/*.test.js',
      'minimal-root.test.js'
    ],
    environment: 'node',
    globals: true
  }
});
